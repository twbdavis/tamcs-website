import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getUserAndProfile } from "@/lib/auth/require-role";
import {
  ATTENDANCE_MIN_PER_SEMESTER,
  type AttendanceRecord,
  type AttendanceSession,
} from "@/lib/content-types";
import { recentAcademicYears, semesterAndYearFor } from "@/lib/attendance";

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const metadata = { title: "My Attendance" };

// Athletes only see the two academic semesters — no Summer option.
const SEMESTERS: ("Fall" | "Spring")[] = ["Fall", "Spring"];

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

export default async function MyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; year?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const now = new Date();
  const today = semesterAndYearFor(now);
  const yearOptions = recentAcademicYears(4);

  // Default to the auto-derived semester unless we're in Summer, in
  // which case fall back to Spring (the most recent academic semester).
  const fallback: "Fall" | "Spring" =
    today.semester === "Summer" ? "Spring" : today.semester;
  const semester: "Fall" | "Spring" = SEMESTERS.includes(
    sp.semester as "Fall" | "Spring",
  )
    ? (sp.semester as "Fall" | "Spring")
    : fallback;
  const academicYear =
    sp.year && /^\d{4}-\d{4}$/.test(sp.year) ? sp.year : today.academic_year;

  const supabase = await createClient();
  // We need the caller's profile to do a JS-level fallback match in
  // case the RLS-filtered rows still miss some thanks to format
  // variations the policy doesn't cover.
  const { profile } = await getUserAndProfile();

  // RLS on attendance_records scopes us to rows that match the caller;
  // pull paged so a long history doesn't get clipped at 1000 rows.
  // Sessions are filtered by semester/year on the server.
  const [rawRecords, { data: rawSessions }] = await Promise.all([
    (async () => {
      const out: AttendanceRecord[] = [];
      const PAGE = 1000;
      let offset = 0;
      while (true) {
        // Stable ordering so paging doesn't drop or duplicate rows.
        const { data } = await supabase
          .from("attendance_records")
          .select("*")
          .order("session_id", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + PAGE - 1)
          .returns<AttendanceRecord[]>();
        const got = data ?? [];
        out.push(...got);
        if (got.length < PAGE) break;
        offset += PAGE;
      }
      return out;
    })(),
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("semester", semester)
      .eq("academic_year", academicYear)
      .order("session_date", { ascending: false })
      .returns<AttendanceSession[]>(),
  ]);

  const sessionsById = new Map((rawSessions ?? []).map((s) => [s.id, s]));

  // Build the candidate identifiers for matching the athlete to records.
  const myUinLast4 =
    profile?.uin && /^\d+$/.test(profile.uin) && profile.uin.length >= 4
      ? profile.uin.slice(-4)
      : null;
  const nameKeys = new Set<string>();
  if (profile?.full_name) nameKeys.add(normalizeName(profile.full_name));
  if (profile?.first_name && profile?.last_name) {
    nameKeys.add(normalizeName(`${profile.first_name}${profile.last_name}`));
    nameKeys.add(normalizeName(`${profile.first_name} ${profile.last_name}`));
  }

  function isMine(r: AttendanceRecord): boolean {
    if (myUinLast4 && r.uin_last4 && r.uin_last4 === myUinLast4) return true;
    if (nameKeys.size > 0 && nameKeys.has(normalizeName(r.athlete_name)))
      return true;
    return false;
  }

  const myRecords = rawRecords.filter(
    (r) => sessionsById.has(r.session_id) && isMine(r),
  );
  const sortedRecords = myRecords
    .map((r) => ({ record: r, session: sessionsById.get(r.session_id)! }))
    .sort((a, b) =>
      b.session.session_date.localeCompare(a.session.session_date),
    );

  const count = myRecords.length;
  const belowMinimum = count < ATTENDANCE_MIN_PER_SEMESTER;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">My attendance</h1>
      <p className="mt-1 text-muted-foreground">
        Your practice attendance for the selected semester.
      </p>

      <div className="mt-6 grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Semester
          </span>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#500000]/30">
            {SEMESTERS.map((s) => (
              <SemesterButton
                key={s}
                href={`/dashboard/my-attendance?semester=${s}&year=${encodeURIComponent(academicYear)}`}
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
            {yearOptions.map((y) => (
              <FilterChip
                key={y}
                href={`/dashboard/my-attendance?semester=${semester}&year=${y}`}
                active={academicYear === y}
                label={y}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-l-4 border-l-[#500000] bg-card p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Practices attended ({semester} {academicYear})
        </div>
        <div className="mt-1 text-3xl font-bold">{count}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Minimum requirement: {ATTENDANCE_MIN_PER_SEMESTER} per semester
        </div>
      </div>

      {belowMinimum ? (
        <div className="mt-4 rounded-md border-l-4 border-l-rose-600 bg-rose-50 p-4 text-sm dark:bg-rose-950/30">
          <strong className="font-semibold">Heads up:</strong> you&apos;re
          currently below the {ATTENDANCE_MIN_PER_SEMESTER}-practice minimum
          for the {semester} semester. Reach out to an officer if you have a
          conflict.
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Attendance log</h2>
        {sortedRecords.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No attendance recorded for this semester yet.
          </p>
        ) : (
          <ul className="grid gap-2">
            {sortedRecords.map(({ record, session }) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{session.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(session.session_date)}
                  </div>
                </div>
                {record.is_restricted ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                    Restricted
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
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

// Big side-by-side semester toggle, pinned to the maroon brand color.
function SemesterButton({
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
      aria-pressed={active}
      className={
        "flex items-center justify-center px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors " +
        (active
          ? "bg-[#500000] text-white shadow-inner"
          : "bg-card text-[#500000] hover:bg-[#500000]/5")
      }
    >
      {label}
    </Link>
  );
}
