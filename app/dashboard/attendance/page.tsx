import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { AttendanceLogger } from "@/components/admin/attendance-logger";
import {
  AttendanceHistory,
  type AthleteTotal,
  type PeriodSummary,
  type SessionSummary,
} from "@/components/admin/attendance-history";
import { recentAcademicYears } from "@/lib/attendance";
import type { KnownAthlete } from "@/lib/attendance";
import type { AttendanceSemester } from "@/lib/content-types";

export const metadata = { title: "Attendance" };

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];
const PAGE_SIZE = 20;

type Tab = "log" | "history";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    semester?: string;
    year?: string;
    page?: string;
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
  const pageParam = Number(sp.page);
  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  let knownAthletes: KnownAthlete[] = [];
  let sessions: SessionSummary[] = [];
  let totals: AthleteTotal[] = [];
  let summary: PeriodSummary = {
    session_count: 0,
    total_records: 0,
    unique_athletes: 0,
  };
  let hasMore = false;

  if (tab === "log") {
    const supabase = await createClient();
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
    const semParam = semester === "all" ? null : semester;
    const yearParam = academicYear === "all" ? null : academicYear;
    const offset = (page - 1) * PAGE_SIZE;

    // Fetch one extra row to know whether there's a next page without
    // running a separate count query.
    const [sessionRes, totalsRes, summaryRes] = await Promise.all([
      supabase.rpc("attendance_session_summaries", {
        p_semester: semParam,
        p_year: yearParam,
        p_limit: PAGE_SIZE + 1,
        p_offset: offset,
      }),
      supabase.rpc("attendance_athlete_totals", {
        p_semester: semParam,
        p_year: yearParam,
      }),
      supabase.rpc("attendance_period_summary", {
        p_semester: semParam,
        p_year: yearParam,
      }),
    ]);

    const rawSessions =
      (sessionRes.data as Array<{
        id: string;
        session_date: string;
        title: string;
        semester: AttendanceSemester;
        academic_year: string;
        participant_count: number;
      }> | null) ?? [];
    hasMore = rawSessions.length > PAGE_SIZE;
    sessions = rawSessions.slice(0, PAGE_SIZE).map((s) => ({
      id: s.id,
      session_date: s.session_date,
      title: s.title,
      semester: s.semester,
      academic_year: s.academic_year,
      participant_count: Number(s.participant_count ?? 0),
    }));

    totals = ((totalsRes.data as Array<{
      athlete_name: string;
      uin_last4: string | null;
      attendance_count: number;
    }> | null) ?? []).map((t) => ({
      athlete_name: t.athlete_name,
      uin_last4: t.uin_last4,
      attendance_count: Number(t.attendance_count ?? 0),
    }));

    const summaryRow = (summaryRes.data as Array<{
      session_count: number;
      total_records: number;
      unique_athletes: number;
    }> | null)?.[0];
    summary = {
      session_count: Number(summaryRow?.session_count ?? 0),
      total_records: Number(summaryRow?.total_records ?? 0),
      unique_athletes: Number(summaryRow?.unique_athletes ?? 0),
    };
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
            totals={totals}
            summary={summary}
            yearOptions={yearOptions}
            semester={semester}
            academicYear={academicYear}
            page={page}
            pageSize={PAGE_SIZE}
            hasMore={hasMore}
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
