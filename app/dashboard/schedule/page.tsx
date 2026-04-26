import Link from "next/link";
import { requireMinRole } from "@/lib/auth/require-role";
import { isPresident } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ScheduleSpreadsheet } from "@/components/admin/schedule-spreadsheet";
import type {
  Coach,
  CoachAssignment,
  CoachingScheduleEntry,
} from "@/lib/content-types";

export const metadata = { title: "Coaching Schedule" };

export default async function ScheduleSpreadsheetPage() {
  // Officers can view the spreadsheet; only the president can edit cells.
  const { profile } = await requireMinRole("officer");
  const canEdit = isPresident(profile?.role);

  const supabase = await createClient();
  const [
    { data: practices },
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

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Coaching schedule</h1>
          <p className="mt-1 text-muted-foreground">
            All practices and team events. Same data as the calendar — edits
            here update everywhere.
          </p>
        </div>
        <Link
          href="/dashboard?month="
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Calendar view →
        </Link>
      </header>

      <section className="mt-6">
        <ScheduleSpreadsheet
          initial={practices ?? []}
          coaches={coaches ?? []}
          initialAssignments={assignments ?? []}
          canEdit={canEdit}
        />
      </section>
    </div>
  );
}
