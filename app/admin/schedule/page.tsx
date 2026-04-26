import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { CoachRosterForm } from "@/components/admin/coach-roster-form";
import { CoachAssignmentToggle } from "@/components/admin/coach-assignment-toggle";
import { ScheduleForm } from "@/components/admin/schedule-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { buttonVariants } from "@/components/ui/button";
import { removeCoachAction } from "@/app/actions/coaches";
import { deleteCoachingScheduleAction } from "@/app/actions/schedule";
import type {
  Coach,
  CoachAssignment,
  CoachingScheduleEntry,
} from "@/lib/content-types";
import {
  DAY_LABELS,
  TYPE_LABELS,
  formatSpecificDate,
  formatTimeRange,
} from "@/lib/schedule";

export const metadata = { title: "Coaching Schedule" };

export default async function AdminSchedulePage() {
  // Editing assignments is president-only; everyone else gets bounced.
  const { profile } = await requireMinRole("officer");
  if (profile?.role !== "president") {
    redirect("/dashboard?error=schedule_president_only");
  }

  const supabase = await createClient();

  const [{ data: practices }, { data: coaches }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("coaching_schedule")
        .select("*")
        .order("recurring", { ascending: false })
        .order("day_of_week", { ascending: true, nullsFirst: false })
        .order("specific_date", { ascending: true, nullsFirst: false })
        .order("start_time")
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

  const assignedByPractice = new Map<string, Set<string>>();
  for (const a of assignments ?? []) {
    let inner = assignedByPractice.get(a.schedule_id);
    if (!inner) {
      inner = new Set();
      assignedByPractice.set(a.schedule_id, inner);
    }
    inner.add(a.coach_id);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Coaching schedule</h1>
      <p className="mt-1 text-muted-foreground">
        Add practices and meetings, then assign coaches to each session.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add practice</h2>
        <ScheduleForm />
      </section>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Coach roster</h2>
        <CoachRosterForm />
        {!coaches || coaches.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No coaches yet. Add one above before assigning practices.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {coaches.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="font-medium">{c.name}</span>
                <DeleteButton
                  action={removeCoachAction}
                  id={c.id}
                  confirmMessage={`Remove ${c.name} from the roster?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Practices</h2>
        {!practices || practices.length === 0 ? (
          <p className="text-muted-foreground">
            No practices on the calendar yet.
          </p>
        ) : (
          <ul className="grid gap-3">
            {practices.map((p) => {
              const assignedSet =
                assignedByPractice.get(p.id) ?? new Set<string>();
              return (
                <li key={p.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {p.title}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          · {TYPE_LABELS[p.type]}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {practiceWhen(p)} · {formatTimeRange(p.start_time, p.end_time)}
                        {p.location ? ` · ${p.location}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/schedule/${p.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteCoachingScheduleAction}
                        id={p.id}
                        confirmMessage={`Delete "${p.title}"?`}
                      />
                    </div>
                  </div>

                  {(coaches?.length ?? 0) === 0 ? null : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(coaches ?? []).map((c) => (
                        <CoachAssignmentToggle
                          key={c.id}
                          scheduleId={p.id}
                          coachId={c.id}
                          name={c.name}
                          assigned={assignedSet.has(c.id)}
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function practiceWhen(p: CoachingScheduleEntry): string {
  if (p.recurring && p.day_of_week !== null) {
    const day = DAY_LABELS[p.day_of_week];
    if (p.effective_from) {
      return `Every ${day} (from ${formatSpecificDate(p.effective_from)})`;
    }
    return `Every ${day}`;
  }
  if (p.specific_date) return formatSpecificDate(p.specific_date);
  return "—";
}
