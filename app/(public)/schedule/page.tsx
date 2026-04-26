import { createClient } from "@/lib/supabase/server";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { parseMonthParam } from "@/lib/schedule";
import type {
  Coach,
  CoachAssignment,
  CoachingScheduleEntry,
} from "@/lib/content-types";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { year, monthIndex0 } = parseMonthParam(month);

  const supabase = await createClient();
  const [
    { data: entries },
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

  const coachById = new Map<string, Coach>();
  for (const c of coaches ?? []) coachById.set(c.id, c);

  const coachesByPractice = new Map<string, Coach[]>();
  for (const a of assignments ?? []) {
    const c = coachById.get(a.coach_id);
    if (!c) continue;
    const list = coachesByPractice.get(a.schedule_id) ?? [];
    list.push(c);
    coachesByPractice.set(a.schedule_id, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold">Schedule</h1>
        <p className="mt-2 text-muted-foreground">
          Practices, dryland, meetings, and team events. Coaches assigned per
          session shown in each cell.
        </p>
      </header>

      <ScheduleCalendar
        basePath="/schedule"
        year={year}
        monthIndex0={monthIndex0}
        entries={entries ?? []}
        coachesByPractice={coachesByPractice}
      />
    </div>
  );
}
