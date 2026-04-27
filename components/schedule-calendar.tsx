import Link from "next/link";
import {
  buildMonthGrid,
  buildMonthOccurrences,
  dateKey,
  formatTime,
  monthLabel,
  monthParam,
  shiftMonth,
} from "@/lib/schedule";
import type {
  Coach,
  CoachingScheduleEntry,
  Social,
} from "@/lib/content-types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_DOT: Record<string, string> = {
  practice: "bg-[#500000]",
  dryland: "bg-amber-600",
  meeting: "bg-blue-600",
  social: "bg-emerald-600",
};

export function ScheduleCalendar({
  basePath,
  year,
  monthIndex0,
  entries,
  coachesByPractice,
  socials = [],
}: {
  basePath: string;
  year: number;
  monthIndex0: number;
  entries: CoachingScheduleEntry[];
  coachesByPractice: Map<string, Coach[]>;
  socials?: Social[];
}) {
  const grid = buildMonthGrid(year, monthIndex0);
  const occ = buildMonthOccurrences(entries, year, monthIndex0);
  const today = dateKey(new Date());

  // Bucket socials into the same date keys the calendar uses.
  const socialsByDate = new Map<string, Social[]>();
  for (const s of socials) {
    const list = socialsByDate.get(s.event_date) ?? [];
    list.push(s);
    socialsByDate.set(s.event_date, list);
  }

  const prev = shiftMonth(year, monthIndex0, -1);
  const next = shiftMonth(year, monthIndex0, 1);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{monthLabel(year, monthIndex0)}</h2>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`${basePath}?month=${monthParam(prev.year, prev.monthIndex0)}`}
            className="rounded border px-3 py-1 hover:bg-muted/40"
          >
            ← Prev
          </Link>
          <Link
            href={basePath}
            className="rounded border px-3 py-1 hover:bg-muted/40"
          >
            Today
          </Link>
          <Link
            href={`${basePath}?month=${monthParam(next.year, next.monthIndex0)}`}
            className="rounded border px-3 py-1 hover:bg-muted/40"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border">
        <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-2 py-2">
              {d}
            </div>
          ))}
        </div>

        {grid.map((week, wi) => {
          // Skip a final all-out-of-month row entirely.
          if (week.every((c) => !c.inMonth)) return null;
          return (
            <div key={wi} className="grid grid-cols-7">
              {week.map((cell) => {
                const sessions = occ.get(cell.key) ?? [];
                const cellSocials = socialsByDate.get(cell.key) ?? [];
                return (
                  <div
                    key={cell.key}
                    className={
                      "min-h-[110px] border-b border-r p-1.5 last:border-r-0 " +
                      (cell.inMonth
                        ? "bg-background"
                        : "bg-muted/20 text-muted-foreground")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          "text-xs font-semibold " +
                          (cell.key === today
                            ? "rounded-full bg-[#500000] px-1.5 py-0.5 text-white"
                            : cell.inMonth
                              ? ""
                              : "opacity-50")
                        }
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-1">
                      {cellSocials.map((soc) => (
                        <li
                          key={`social-${soc.id}`}
                          className="rounded border border-emerald-300/60 bg-emerald-50 p-1.5 text-[11px] leading-tight dark:bg-emerald-950/30"
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="size-1.5 rounded-full bg-emerald-600"
                              aria-hidden
                            />
                            <span className="font-semibold">
                              {soc.event_time
                                ? formatTime(soc.event_time + ":00")
                                : "Social"}
                            </span>
                            <span className="ml-auto rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                              Social
                            </span>
                          </div>
                          <div className="truncate font-medium">{soc.title}</div>
                          {soc.location ? (
                            <div className="truncate text-muted-foreground">
                              {soc.location}
                            </div>
                          ) : null}
                        </li>
                      ))}
                      {sessions.map((s) => {
                        const coaches = coachesByPractice.get(s.id) ?? [];
                        return (
                          <li
                            key={s.id}
                            className="rounded border bg-card p-1.5 text-[11px] leading-tight"
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className={
                                  "size-1.5 rounded-full " +
                                  (TYPE_DOT[s.type] ?? "bg-muted")
                                }
                                aria-hidden
                              />
                              <span className="font-semibold">
                                {formatTime(s.start_time)}
                              </span>
                            </div>
                            <div className="truncate">{s.title}</div>
                            {s.location ? (
                              <div className="truncate text-muted-foreground">
                                {s.location}
                              </div>
                            ) : null}
                            <div
                              className={
                                "mt-0.5 truncate " +
                                (coaches.length > 0
                                  ? "text-muted-foreground"
                                  : "italic text-muted-foreground/70")
                              }
                            >
                              {coaches.length > 0
                                ? `Coaches: ${coaches.map((c) => c.name).join(", ")}`
                                : "No coaches assigned"}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
