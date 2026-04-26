import { createClient } from "@/lib/supabase/server";
import { compareEvents } from "@/lib/swim-events";
import type { MeetResult, MeetResultEntry } from "@/lib/content-types";

export const metadata = { title: "Meets" };

type RawEntry = Record<string, unknown>;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function compareTimes(a: string, b: string): number {
  const av = toSeconds(a);
  const bv = toSeconds(b);
  if (av === null || bv === null) return a.localeCompare(b);
  return av - bv;
}
function toSeconds(t: string): number | null {
  const m = t.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const min = m[1] ? Number(m[1]) : 0;
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min * 60 + sec;
}

function readEntries(raw: unknown): MeetResultEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MeetResultEntry[] = [];
  for (const r of raw as RawEntry[]) {
    const event = typeof r?.event === "string" ? r.event : "";
    const swimmer = typeof r?.swimmer === "string" ? r.swimmer : "";
    const time = typeof r?.time === "string" ? r.time : "";
    if (event && swimmer && time) out.push({ event, swimmer, time });
  }
  return out;
}

function groupByEvent(entries: MeetResultEntry[]) {
  const map = new Map<string, MeetResultEntry[]>();
  for (const e of entries) {
    const list = map.get(e.event) ?? [];
    list.push(e);
    map.set(e.event, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => compareTimes(a.time, b.time));
  }
  return [...map.entries()].sort(([a], [b]) => compareEvents(a, b));
}

export default async function MeetResultsPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: meets },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("meet_results")
      .select("*")
      .order("date", { ascending: false })
      .returns<MeetResult[]>(),
  ]);
  const showDetails = !!user;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Meets</h1>
        <p className="mt-2 text-muted-foreground">
          {showDetails
            ? "Results from recent TAMCS meets."
            : "Results from recent TAMCS meets. Sign in to see individual times."}
        </p>
      </header>

      {!meets || meets.length === 0 ? (
        <p className="text-muted-foreground">
          No meet results have been posted yet.
        </p>
      ) : (
        <div className="space-y-8">
          {meets.map((m) => {
            const groups = showDetails
              ? groupByEvent(readEntries(m.results))
              : [];
            return (
              <article
                key={m.id}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <header
                  className={
                    "bg-muted/30 px-5 py-4 " +
                    (showDetails ? "border-b" : "")
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-semibold">{m.meet_name}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {m.location ? ` · ${m.location}` : ""}
                      </p>
                    </div>
                    {m.overall_place ? (
                      <span className="rounded-full bg-[#500000] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        Team finished {ordinal(m.overall_place)}
                      </span>
                    ) : null}
                  </div>
                </header>

                {showDetails ? (
                  <div className="p-5">
                    {groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No individual results recorded.
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {groups.map(([event, list]) => (
                          <details
                            key={event}
                            className="group rounded-md border bg-background"
                          >
                            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                              <span className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground transition-transform group-open:rotate-90">
                                  ▶
                                </span>
                                {event}
                              </span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {list.length}{" "}
                                {list.length === 1 ? "swimmer" : "swimmers"}
                              </span>
                            </summary>
                            <ul className="grid gap-0 border-t px-4 py-2 text-sm">
                              {list.map((r, i) => (
                                <li
                                  key={i}
                                  className="flex justify-between gap-4 border-b py-1.5 last:border-none"
                                >
                                  <span>{r.swimmer}</span>
                                  <span className="font-mono text-muted-foreground">
                                    {r.time}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ))}
                      </div>
                    )}

                    {m.notes ? (
                      <p className="mt-4 text-sm text-foreground/85">{m.notes}</p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
