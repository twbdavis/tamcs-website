import { createClient } from "@/lib/supabase/server";
import type { MeetResult } from "@/lib/content-types";

export const metadata = { title: "Meet Results" };

type ResultEntry = {
  event?: string;
  swimmer?: string;
  time?: string;
  place?: number | string;
};

export default async function MeetResultsPage() {
  const supabase = await createClient();
  const { data: meets } = await supabase
    .from("meet_results")
    .select("*")
    .order("date", { ascending: false })
    .returns<MeetResult[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Meet Results</h1>
        <p className="mt-2 text-muted-foreground">
          Results from recent TAMCS meets.
        </p>
      </header>

      {!meets || meets.length === 0 ? (
        <p className="text-muted-foreground">
          No meet results have been posted yet.
        </p>
      ) : (
        <div className="space-y-8">
          {meets.map((m) => {
            const entries: ResultEntry[] = Array.isArray(m.results)
              ? (m.results as ResultEntry[])
              : [];
            return (
              <article
                key={m.id}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-xl font-semibold">{m.meet_name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                </header>
                <div className="p-5">
                  {entries.length > 0 ? (
                    <ul className="grid gap-2 text-sm sm:grid-cols-2">
                      {entries.map((r, i) => (
                        <li
                          key={i}
                          className="flex justify-between gap-4 border-b py-1.5 last:border-none"
                        >
                          <span>
                            <span className="font-medium">
                              {r.event ?? "—"}
                            </span>
                            {r.swimmer ? ` · ${r.swimmer}` : ""}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {r.place ? `#${r.place} ` : ""}
                            {r.time ?? ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No individual results recorded.
                    </p>
                  )}
                  {m.notes ? (
                    <p className="mt-4 text-sm text-foreground/85">{m.notes}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
