import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteWorkoutSetAction } from "@/app/actions/workouts";
import type { WorkoutSet, WorkoutSetStatus } from "@/lib/content-types";

export const metadata = { title: "My Workout Sets" };

const STATUS_STYLES: Record<WorkoutSetStatus, string> = {
  pending:
    "bg-amber-100 text-amber-900 ring-1 ring-amber-300/60 dark:bg-amber-950/40 dark:text-amber-200",
  approved:
    "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  denied:
    "bg-rose-100 text-rose-900 ring-1 ring-rose-300/60 dark:bg-rose-950/40 dark:text-rose-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function MyWorkoutSetsPage() {
  const { user } = await requireMinRole("coach");

  const supabase = await createClient();
  const { data: sets } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .returns<WorkoutSet[]>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My workout sets</h1>
          <p className="mt-1 text-muted-foreground">
            Track the status of every set you&apos;ve submitted.
          </p>
        </div>
        <Link
          href="/dashboard/workouts/create"
          className={buttonVariants({ variant: "default" })}
        >
          + New set
        </Link>
      </header>

      <div className="mt-8 grid gap-3">
        {!sets || sets.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            You haven&apos;t submitted any sets yet.
          </p>
        ) : (
          sets.map((s) => (
            <div
              key={s.id}
              className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {formatDate(s.created_at)}
                </p>
                {s.review_comment ? (
                  <p className="mt-2 rounded-md border-l-2 border-l-muted-foreground/40 bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-medium">Reviewer note:</span>{" "}
                    {s.review_comment}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/dashboard/workouts/${s.id}/edit`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteWorkoutSetAction}
                  id={s.id}
                  confirmMessage={`Delete "${s.title}"?`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
