import Link from "next/link";
import {
  ATTENDANCE_MIN_PER_SEMESTER,
  type AttendanceRecord,
  type AttendanceSemester,
  type AttendanceSession,
} from "@/lib/content-types";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteAttendanceSessionAction } from "@/app/actions/attendance";
import { AttendanceCsvButtons } from "@/components/admin/attendance-csv-buttons";

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

function formatDate(iso: string) {
  // session_date is YYYY-MM-DD (no time); render in local-stable form.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function athleteKey(name: string, uin: string | null): string {
  return `${name.trim().toLowerCase()}|${uin ?? ""}`;
}

export function AttendanceHistory({
  sessions,
  records,
  yearOptions,
  semester,
  academicYear,
  basePath = "/dashboard/attendance",
}: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  yearOptions: string[];
  semester: AttendanceSemester | "all";
  academicYear: string | "all";
  basePath?: string;
}) {
  const recordsBySession = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = recordsBySession.get(r.session_id) ?? [];
    list.push(r);
    recordsBySession.set(r.session_id, list);
  }

  // Per-athlete attendance totals across the filtered window.
  const totals = new Map<
    string,
    { name: string; uin: string | null; count: number }
  >();
  for (const r of records) {
    const key = athleteKey(r.athlete_name, r.uin_last4);
    const existing = totals.get(key);
    if (existing) existing.count++;
    else
      totals.set(key, {
        name: r.athlete_name,
        uin: r.uin_last4,
        count: 1,
      });
  }
  const totalsList = Array.from(totals.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
  // Standard competition ranking: equal counts share a rank; the next
  // distinct count picks up at (idx + 1) so ranks can skip (1, 2, 2, 4).
  const ranks: number[] = [];
  for (let i = 0; i < totalsList.length; i++) {
    if (i > 0 && totalsList[i].count === totalsList[i - 1].count) {
      ranks.push(ranks[i - 1]);
    } else {
      ranks.push(i + 1);
    }
  }

  const sessionCount = sessions.length;
  const totalAttendances = records.length;
  const avg = sessionCount === 0 ? 0 : totalAttendances / sessionCount;
  const uniqueAthletes = totals.size;

  return (
    <div className="grid gap-6">
      <FilterBar
        semester={semester}
        academicYear={academicYear}
        yearOptions={yearOptions}
        basePath={basePath}
      />

      <SummaryCards
        sessions={sessionCount}
        average={avg}
        uniqueAthletes={uniqueAthletes}
      />

      <AttendanceCsvButtons sessions={sessions} records={records} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Sessions</h2>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No sessions logged for this filter.
          </p>
        ) : (
          <div className="grid gap-3">
            {sessions.map((s) => {
              const rs = recordsBySession.get(s.id) ?? [];
              return (
                <details
                  key={s.id}
                  className="group rounded-lg border bg-card shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-base font-semibold">{s.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(s.session_date)}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {s.semester} {s.academic_year}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rs.length}{" "}
                        {rs.length === 1 ? "athlete" : "athletes"} present
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/attendance/${s.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteAttendanceSessionAction}
                        id={s.id}
                        confirmMessage={`Delete this session and all ${rs.length} record${rs.length === 1 ? "" : "s"}?`}
                      />
                      <span
                        aria-hidden
                        className="text-xs text-muted-foreground transition-transform group-open:rotate-90"
                      >
                        ▶
                      </span>
                    </div>
                  </summary>
                  <div className="border-t px-5 py-4">
                    {rs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records.</p>
                    ) : (
                      <ul className="grid gap-1 text-sm sm:grid-cols-2">
                        {rs
                          .slice()
                          .sort((a, b) =>
                            a.athlete_name.localeCompare(b.athlete_name),
                          )
                          .map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center gap-2"
                            >
                              <span>{r.athlete_name}</span>
                              {r.uin_last4 ? (
                                <span className="font-mono text-xs text-muted-foreground">
                                  ({r.uin_last4})
                                </span>
                              ) : null}
                              {r.is_restricted ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                                  Restricted
                                </span>
                              ) : null}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Per-athlete totals
          {semester !== "all" || academicYear !== "all" ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({semester !== "all" ? semester : "All semesters"}
              {academicYear !== "all" ? `, ${academicYear}` : ""})
            </span>
          ) : null}
        </h2>
        {totalsList.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No athletes attended.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="w-12 px-3 py-2 text-right font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Athlete</th>
                  <th className="px-3 py-2 font-medium">UIN</th>
                  <th className="px-3 py-2 text-right font-medium">Count</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {totalsList.map((t, idx) => {
                  const meetsMinimum = t.count >= ATTENDANCE_MIN_PER_SEMESTER;
                  const flagged = semester !== "all" && !meetsMinimum;
                  const rank = ranks[idx];
                  return (
                    <tr key={`${t.name}|${t.uin ?? ""}`} className="border-t">
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                        {rank}
                      </td>
                      <td className="px-3 py-2">{t.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {t.uin ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {t.count}
                      </td>
                      <td className="px-3 py-2">
                        {flagged ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900">
                            Below minimum (&lt; {ATTENDANCE_MIN_PER_SEMESTER})
                          </span>
                        ) : meetsMinimum ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                            Met minimum
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterBar({
  semester,
  academicYear,
  yearOptions,
  basePath,
}: {
  semester: AttendanceSemester | "all";
  academicYear: string | "all";
  yearOptions: string[];
  basePath: string;
}) {
  const linkFor = (sem: AttendanceSemester | "all", yr: string | "all") => {
    const params = new URLSearchParams();
    params.set("tab", "history");
    if (sem !== "all") params.set("semester", sem);
    if (yr !== "all") params.set("year", yr);
    return `${basePath}?${params.toString()}`;
  };
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Semester
        </span>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            href={linkFor("all", academicYear)}
            active={semester === "all"}
            label="All"
          />
          {SEMESTERS.map((s) => (
            <FilterChip
              key={s}
              href={linkFor(s, academicYear)}
              active={semester === s}
              label={s}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Academic year
        </span>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            href={linkFor(semester, "all")}
            active={academicYear === "all"}
            label="All"
          />
          {yearOptions.map((y) => (
            <FilterChip
              key={y}
              href={linkFor(semester, y)}
              active={academicYear === y}
              label={y}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-xs " +
        (active
          ? "border-[#500000] bg-[#500000] text-white"
          : "hover:bg-muted")
      }
    >
      {label}
    </Link>
  );
}

function SummaryCards({
  sessions,
  average,
  uniqueAthletes,
}: {
  sessions: number;
  average: number;
  uniqueAthletes: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Sessions logged" value={String(sessions)} />
      <Stat
        label="Avg attendance / session"
        value={sessions === 0 ? "—" : average.toFixed(1)}
      />
      <Stat label="Unique athletes" value={String(uniqueAthletes)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-l-4 border-l-[#500000] bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
