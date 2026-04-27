import Link from "next/link";
import {
  Award,
  CalendarClock,
  CalendarDays,
  Camera,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Download,
  Dumbbell,
  FileEdit,
  FileText,
  FolderOpen,
  ListChecks,
  Mail,
  Megaphone,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-role";
import {
  hasRoleAtLeast,
  isAdminOrAbove,
  isPresident,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { parseMonthParam } from "@/lib/schedule";
import type {
  Coach,
  CoachAssignment,
  CoachingScheduleEntry,
} from "@/lib/content-types";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

const CARD_CLASS =
  "group flex items-start gap-4 rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#500000]";

const ICON_TILE_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000] transition-colors group-hover:bg-[#500000] group-hover:text-white";

const SECTION_HEADING_CLASS =
  "inline-block border-b-4 border-[#500000] pb-1 text-2xl font-semibold";

type DashCardProps = {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  external?: boolean;
  download?: boolean;
};

function DashCard({
  href,
  title,
  description,
  Icon,
  external,
  download,
}: DashCardProps) {
  const arrow = download ? "↓" : external ? "↗" : "→";
  const body = (
    <>
      <span className={ICON_TILE_CLASS}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold group-hover:text-[#500000]">
          {title} {arrow}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  );
  if (external || download) {
    return (
      <a
        href={href}
        className={CARD_CLASS}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...(download ? { download: true } : {})}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={CARD_CLASS}>
      {body}
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { user, profile } = await requireUser();
  const { month } = await searchParams;

  const name = profile?.full_name ?? user.email ?? "swimmer";
  const role = profile?.role ?? "guest";
  const showSchedule = hasRoleAtLeast(role, "officer");
  const president = isPresident(role);
  const adminish = isAdminOrAbove(role);
  const isCoach = role === "coach";

  let entries: CoachingScheduleEntry[] = [];
  let coachesByPractice = new Map<string, Coach[]>();
  if (showSchedule) {
    const supabase = await createClient();
    const [
      { data: rawEntries },
      { data: coaches },
      { data: assignments },
    ] = await Promise.all([
      supabase
        .from("coaching_schedule")
        .select("*")
        .returns<CoachingScheduleEntry[]>(),
      supabase
        .from("coaches")
        .select("*")
        .order("display_order")
        .order("name")
        .returns<Coach[]>(),
      supabase
        .from("coaching_schedule_coaches")
        .select("*")
        .returns<CoachAssignment[]>(),
    ]);
    entries = rawEntries ?? [];
    const coachById = new Map<string, Coach>();
    for (const c of coaches ?? []) coachById.set(c.id, c);
    for (const a of assignments ?? []) {
      const c = coachById.get(a.coach_id);
      if (!c) continue;
      const list = coachesByPractice.get(a.schedule_id) ?? [];
      list.push(c);
      coachesByPractice.set(a.schedule_id, list);
    }
  }

  const { year, monthIndex0 } = parseMonthParam(month);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold">Welcome, {name}</h1>
        {adminish ? (
          <Link
            href="/admin"
            className={`${buttonVariants({ size: "sm" })} gap-2`}
          >
            <ShieldCheck className="size-4" />
            Admin tools
          </Link>
        ) : null}
      </header>

      <section className="mt-10">
        <h2 className={SECTION_HEADING_CLASS}>Team</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DashCard
            href="/dashboard/meets"
            title="Meet Information"
            description="Travel details, heat sheets, signups, and meet schedules."
            Icon={FolderOpen}
          />
          <DashCard
            href="/forms"
            title="Open forms"
            description="Submit RSVPs, sign-ups, and team feedback."
            Icon={ClipboardList}
          />
          <DashCard
            href="/dashboard/announcements"
            title="Weekly announcements"
            description="Newest first — the latest team-wide updates."
            Icon={Megaphone}
          />
          <DashCard
            href="/dashboard/ccs"
            title="CCS Resources"
            description="College Club Swimming registration instructions and links."
            Icon={Award}
          />
          <DashCard
            href="/dashboard/my-attendance"
            title="My attendance"
            description="Your practice attendance for the current semester."
            Icon={UserCheck}
          />
          <DashCard
            href="/docs/TAMCS_Constitution_2026-2027.docx.pdf"
            title="TAMCS Constitution"
            description="Team constitution and bylaws (2026-2027)."
            Icon={FileText}
            external
          />
          <DashCard
            href="https://join.photocircleapp.com/QBRE0EEQMX"
            title="Team Photos"
            description="Share and view team photos on PhotoCircle."
            Icon={Camera}
            external
          />
        </div>
      </section>

      {showSchedule ? (
        <section className="mt-12">
          <h2 className={SECTION_HEADING_CLASS}>Officer tools</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DashCard
              href="/dashboard/availability"
              title="Officer availability"
              description="Submit your weekly free blocks and see when everyone overlaps."
              Icon={CalendarClock}
            />
            <DashCard
              href="/dashboard/invoice"
              title="Invoice builder"
              description="Generate a branded PDF invoice for sponsors and reimbursements."
              Icon={Receipt}
            />
            <DashCard
              href="/admin/forms"
              title="Manage forms"
              description="Create forms, publish them, and review responses."
              Icon={FileEdit}
            />
            <DashCard
              href="/dashboard/meets/manage"
              title="Manage meets"
              description="Build the upcoming-meets feed with travel and signup info."
              Icon={Trophy}
            />
            <DashCard
              href="/dashboard/workouts/review"
              title="Review workout sets"
              description="Approve or deny coach-submitted sets before they hit the bank."
              Icon={ClipboardCheck}
            />
            <DashCard
              href="/dashboard/workouts/bank"
              title="Workout bank"
              description="Browse every approved set from the coaching staff."
              Icon={Dumbbell}
            />
            <DashCard
              href="/dashboard/announcements/manage"
              title="Manage announcements"
              description="Edit, publish, or manually create weekly updates."
              Icon={Megaphone}
            />
            <DashCard
              href="/dashboard/schedule"
              title="Coaching schedule"
              description={
                president
                  ? "Edit all practices in a single Excel-like grid."
                  : "Browse every practice in a single Excel-like grid."
              }
              Icon={CalendarDays}
            />
            <DashCard
              href="/dashboard/attendance"
              title="Attendance"
              description="Log practice roll-call and review per-athlete attendance totals."
              Icon={CheckSquare}
            />
            <DashCard
              href="/dashboard/email-list"
              title="Email list"
              description="Spreadsheet of every contact — search, edit inline, copy active emails."
              Icon={Mail}
            />
            <DashCard
              href="/dashboard/roster"
              title="Roster information"
              description={
                adminish
                  ? "Search, sort, manage roles, and export the team to CSV."
                  : "Search and sort the team roster (read-only)."
              }
              Icon={Users}
            />
            <DashCard
              href="/downloads/FinanceToolSwim.exe"
              title="Finance Tool"
              description="Download the TAMCS finance management application (Windows)."
              Icon={Download}
              download
            />
          </div>
        </section>
      ) : null}

      {isCoach ? (
        <section className="mt-12">
          <h2 className={SECTION_HEADING_CLASS}>Workouts</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DashCard
              href="/dashboard/workouts/create"
              title="Create set"
              description="Build a new workout set and submit it for officer review."
              Icon={PlusCircle}
            />
            <DashCard
              href="/dashboard/workouts/mine"
              title="My submissions"
              description="Track the status of your pending, approved, and denied sets."
              Icon={ListChecks}
            />
            <DashCard
              href="/dashboard/workouts/bank"
              title="Workout bank"
              description="Browse every approved set from the coaching staff."
              Icon={Dumbbell}
            />
          </div>
        </section>
      ) : null}

      {showSchedule ? (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={SECTION_HEADING_CLASS}>Coaching schedule</h2>
            {president ? (
              <Link
                href="/admin/schedule"
                className={buttonVariants({ size: "sm" })}
              >
                Manage assignments
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">
                Read-only · the president manages coach assignments
              </span>
            )}
          </div>

          <ScheduleCalendar
            basePath="/dashboard"
            year={year}
            monthIndex0={monthIndex0}
            entries={entries}
            coachesByPractice={coachesByPractice}
          />
        </section>
      ) : null}
    </div>
  );
}
