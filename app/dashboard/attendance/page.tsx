import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { AttendanceLogger } from "@/components/admin/attendance-logger";
import { AttendanceHistory } from "@/components/admin/attendance-history";
import { recentAcademicYears } from "@/lib/attendance";
import type { KnownAthlete } from "@/lib/attendance";
import type {
  AttendanceRecord,
  AttendanceSemester,
  AttendanceSession,
} from "@/lib/content-types";

export const metadata = { title: "Attendance" };

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

type Tab = "log" | "history";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    semester?: string;
    year?: string;
  }>;
}) {
  await requireMinRole("officer");
  const sp = await searchParams;
  const tab: Tab = sp.tab === "history" ? "history" : "log";
  const semester: AttendanceSemester | "all" = SEMESTERS.includes(
    sp.semester as AttendanceSemester,
  )
    ? (sp.semester as AttendanceSemester)
    : "all";
  const yearOptions = recentAcademicYears(4);
  const academicYear: string | "all" =
    sp.year && /^\d{4}-\d{4}$/.test(sp.year) ? sp.year : "all";

  let sessions: AttendanceSession[] = [];
  let records: AttendanceRecord[] = [];
  let knownAthletes: KnownAthlete[] = [];
  if (tab === "log") {
    const supabase = await createClient();
    // Pull roster names so the sportclubs camelCase splitter can resolve
    // multi-word last names ("MohAli" → "Moh-Ali", etc.). Officer-tier
    // already passes RLS for /select on profiles.
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .returns<{ first_name: string | null; last_name: string | null }[]>();
    knownAthletes = (data ?? [])
      .filter((p) => p.first_name && p.last_name)
      .map((p) => ({
        first: p.first_name as string,
        last: p.last_name as string,
      }));
  }
  if (tab === "history") {
    const supabase = await createClient();
    let q = supabase
      .from("attendance_sessions")
      .select("*")
      .order("session_date", { ascending: false });
    if (semester !== "all") q = q.eq("semester", semester);
    if (academicYear !== "all") q = q.eq("academic_year", academicYear);
    const { data: sessionRows } = await q.returns<AttendanceSession[]>();
    sessions = sessionRows ?? [];
    if (sessions.length > 0) {
      const ids = sessions.map((s) => s.id);
      // PostgREST defaults to a 1000-row cap. Chunk the IDs so each
      // request stays under the cap (≈30 sessions × 50 athletes ≈ 1500
      // worst case, but typical practices run 30-60). Always order so
      // results are deterministic across runs.
      const SESSIONS_PER_CHUNK = 25;
      for (let i = 0; i < ids.length; i += SESSIONS_PER_CHUNK) {
        const slice = ids.slice(i, i + SESSIONS_PER_CHUNK);
        // Belt-and-suspenders pagination inside the chunk in case a
        // single block of sessions still happens to clear 1000 rows.
        const PAGE = 1000;
        let offset = 0;
        while (true) {
          const { data: chunk } = await supabase
            .from("attendance_records")
            .select("*")
            .in("session_id", slice)
            .order("session_id", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + PAGE - 1)
            .returns<AttendanceRecord[]>();
          const got = chunk ?? [];
          records.push(...got);
          if (got.length < PAGE) break;
          offset += PAGE;
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Attendance</h1>
      <p className="mt-1 text-muted-foreground">
        Paste the practice roll-call to log a session, then review attendance
        history and per-athlete totals.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        <TabLink href="/dashboard/attendance?tab=log" active={tab === "log"}>
          Log attendance
        </TabLink>
        <TabLink
          href="/dashboard/attendance?tab=history"
          active={tab === "history"}
        >
          Attendance history
        </TabLink>
      </nav>

      <section className="mt-6">
        {tab === "log" ? (
          <AttendanceLogger knownAthletes={knownAthletes} />
        ) : (
          <AttendanceHistory
            sessions={sessions}
            records={records}
            yearOptions={yearOptions}
            semester={semester}
            academicYear={academicYear}
          />
        )}
      </section>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-sm " +
        (active
          ? "border-[#500000] bg-[#500000] text-white"
          : "hover:bg-muted")
      }
    >
      {children}
    </Link>
  );
}
