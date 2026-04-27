"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ATTENDANCE_MIN_PER_SEMESTER,
  type AttendanceSemester,
} from "@/lib/content-types";
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  deleteAttendanceSessionAction,
  fetchSessionRecordsAction,
} from "@/app/actions/attendance";

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

export type SessionSummary = {
  id: string;
  session_date: string;
  title: string;
  semester: AttendanceSemester;
  academic_year: string;
  participant_count: number;
};

export type AthleteTotal = {
  athlete_name: string;
  uin_last4: string | null;
  attendance_count: number;
};

export type PeriodSummary = {
  session_count: number;
  total_records: number;
  unique_athletes: number;
};

type SessionRecord = {
  id: string;
  athlete_name: string;
  uin_last4: string | null;
  is_restricted: boolean;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AttendanceHistory({
  sessions,
  totals,
  summary,
  yearOptions,
  semester,
  academicYear,
  page,
  pageSize,
  hasMore,
  basePath = "/dashboard/attendance",
}: {
  sessions: SessionSummary[];
  totals: AthleteTotal[];
  summary: PeriodSummary;
  yearOptions: string[];
  semester: AttendanceSemester | "all";
  academicYear: string | "all";
  page: number;
  pageSize: number;
  hasMore: boolean;
  basePath?: string;
}) {
  // Standard competition ranking: ties share a rank.
  const ranks: number[] = [];
  for (let i = 0; i < totals.length; i++) {
    if (i > 0 && totals[i].attendance_count === totals[i - 1].attendance_count) {
      ranks.push(ranks[i - 1]);
    } else {
      ranks.push(i + 1);
    }
  }

  const avg =
    summary.session_count === 0
      ? 0
      : summary.total_records / summary.session_count;

  return (
    <div className="grid gap-6">
      <FilterBar
        semester={semester}
        academicYear={academicYear}
        yearOptions={yearOptions}
        basePath={basePath}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sessions logged" value={String(summary.session_count)} />
        <Stat
          label="Avg attendance / session"
          value={summary.session_count === 0 ? "—" : avg.toFixed(1)}
        />
        <Stat
          label="Unique athletes"
          value={String(summary.unique_athletes)}
        />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <span className="text-xs text-muted-foreground">
            Page {page} · {pageSize} per page
          </span>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No sessions logged for this filter.
          </p>
        ) : (
          <div className="grid gap-3">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
        <Pagination
          basePath={basePath}
          semester={semester}
          academicYear={academicYear}
          page={page}
          hasMore={hasMore}
        />
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
        {totals.length === 0 ? (
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
                {totals.map((t, idx) => {
                  const meets =
                    t.attendance_count >= ATTENDANCE_MIN_PER_SEMESTER;
                  const flagged = semester !== "all" && !meets;
                  return (
                    <tr
                      key={`${t.athlete_name}|${t.uin_last4 ?? ""}`}
                      className="border-t"
                    >
                      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                        {ranks[idx]}
                      </td>
                      <td className="px-3 py-2">{t.athlete_name}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {t.uin_last4 ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {t.attendance_count}
                      </td>
                      <td className="px-3 py-2">
                        {flagged ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900">
                            Below minimum (&lt; {ATTENDANCE_MIN_PER_SEMESTER})
                          </span>
                        ) : meets ? (
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

function SessionRow({ session: s }: { session: SessionSummary }) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    if (records !== null) {
      setOpen(true);
      return;
    }
    setLoading(true);
    startTransition(async () => {
      const res = await fetchSessionRecordsAction(s.id);
      setLoading(false);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setRecords(res.records);
      setOpen(true);
    });
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <button
          type="button"
          onClick={toggle}
          className="min-w-0 flex-1 text-left"
        >
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
            {s.participant_count}{" "}
            {s.participant_count === 1 ? "athlete" : "athletes"} present
          </p>
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/attendance/${s.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <DeleteButton
            action={deleteAttendanceSessionAction}
            id={s.id}
            confirmMessage={`Delete this session and all ${s.participant_count} record${s.participant_count === 1 ? "" : "s"}?`}
          />
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={toggle}
            className="text-xs text-muted-foreground"
          >
            {open ? "▼" : "▶"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t px-5 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading records…</p>
          ) : records === null ? null : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records.</p>
          ) : (
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {records.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
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
      ) : null}
    </div>
  );
}

function Pagination({
  basePath,
  semester,
  academicYear,
  page,
  hasMore,
}: {
  basePath: string;
  semester: AttendanceSemester | "all";
  academicYear: string | "all";
  page: number;
  hasMore: boolean;
}) {
  const linkFor = (p: number) => {
    const params = new URLSearchParams();
    params.set("tab", "history");
    if (semester !== "all") params.set("semester", semester);
    if (academicYear !== "all") params.set("year", academicYear);
    if (p > 1) params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };
  if (page === 1 && !hasMore) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      {page > 1 ? (
        <Link
          href={linkFor(page - 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← Prev
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          ← Prev
        </Button>
      )}
      {hasMore ? (
        <Link
          href={linkFor(page + 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Next →
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next →
        </Button>
      )}
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
