import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { SetBuilder } from "@/components/workouts/set-builder";
import type { WorkoutSection, WorkoutSet } from "@/lib/content-types";

export const metadata = { title: "Edit Workout Set" };

export default async function EditWorkoutSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await requireMinRole("coach");
  if (profile?.role !== "coach") {
    redirect("/dashboard/workouts/bank");
  }
  const { id } = await params;

  const supabase = await createClient();
  const { data: set } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("id", id)
    .single<WorkoutSet>();

  if (!set || set.created_by !== user.id) notFound();

  const { data: sections } = await supabase
    .from("workout_sections")
    .select("*")
    .eq("set_id", id)
    .order("display_order")
    .returns<WorkoutSection[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/workouts/mine"
          className="text-muted-foreground hover:text-primary"
        >
          ← My submissions
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit set</h1>
      <p className="mt-1 text-muted-foreground">
        Saving will reset the status to <em>pending</em> and clear any prior
        review comment.
      </p>

      <div className="mt-8">
        <SetBuilder set={set} initialSections={sections ?? []} />
      </div>
    </div>
  );
}
