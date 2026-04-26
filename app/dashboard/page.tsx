import Link from "next/link";
import { FolderOpen, FileText, Download } from "lucide-react";
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

const TEAM_RESOURCES = [
  {
    title: "Meet Information",
    description: "Travel details, heat sheets, and meet schedules",
    href: "https://drive.google.com/drive/folders/1s62XldF37lyjmmT3ocILR8yZczy18pxx",
    Icon: FolderOpen,
  },
  {
    title: "TAMCS Constitution",
    description: "Team constitution and bylaws (2026-2027)",
    href: "/docs/TAMCS_Constitution_2026-2027.docx.pdf",
    Icon: FileText,
  },
] as const;

// Shared classNames keep the dashboard cards visually consistent.
const CARD_CLASS =
  "group rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#500000]";

const SECTION_HEADING_CLASS =
  "inline-block border-b-4 border-[#500000] pb-1 text-2xl font-semibold";

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
            className={buttonVariants({ variant: "outline" })}
          >
            Admin
          </Link>
        ) : null}
      </header>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className={SECTION_HEADING_CLASS}>Team</h2>
          {showSchedule ? (
            <span className="text-xs text-muted-foreground">
              What every athlete sees
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/meets" className={CARD_CLASS}>
            <div className="font-semibold group-hover:text-[#500000]">
              Upcoming meets →
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Travel info, signups, and heat-sheet attachments.
            </p>
          </Link>
          <Link href="/forms" className={CARD_CLASS}>
            <div className="font-semibold group-hover:text-[#500000]">
              Open forms →
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit RSVPs, sign-ups, and team feedback.
            </p>
          </Link>
          {TEAM_RESOURCES.map(({ title, description, href, Icon }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${CARD_CLASS} flex items-start gap-4`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000] transition-colors group-hover:bg-[#500000] group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold group-hover:text-[#500000]">
                  {title} ↗
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {showSchedule ? (
        <section className="mt-12">
          <h2 className={SECTION_HEADING_CLASS}>Officer tools</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/availability" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Officer availability →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit your weekly free blocks and see when everyone overlaps.
              </p>
            </Link>
            <Link href="/dashboard/invoice" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Invoice builder →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a branded PDF invoice for sponsors and reimbursements.
              </p>
            </Link>
            <Link href="/admin/forms" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Manage forms →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Create forms, publish them, and review responses.
              </p>
            </Link>
            <Link href="/dashboard/meets/manage" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Manage meets →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Build the upcoming-meets feed with travel and signup info.
              </p>
            </Link>
            <Link href="/dashboard/schedule" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Coaching schedule →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {president
                  ? "Edit all practices in a single Excel-like grid."
                  : "Browse every practice in a single Excel-like grid."}
              </p>
            </Link>
            <Link href="/dashboard/roster" className={CARD_CLASS}>
              <div className="font-semibold group-hover:text-[#500000]">
                Roster information →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {adminish
                  ? "Search, sort, manage roles, and export the team to CSV."
                  : "Search and sort the team roster (read-only)."}
              </p>
            </Link>
            <a
              href="/downloads/FinanceToolSwim.exe"
              download
              className={`${CARD_CLASS} flex items-start gap-4`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000] transition-colors group-hover:bg-[#500000] group-hover:text-white">
                <Download className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold group-hover:text-[#500000]">
                  Finance Tool ↓
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download the TAMCS finance management application (Windows).
                </p>
              </div>
            </a>
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
