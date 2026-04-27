import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { SetView } from "@/components/workouts/set-view";
import { ReviewForm } from "@/components/workouts/review-form";
import type {
  WorkoutSection,
  WorkoutSet,
  WorkoutSetStatus,
} from "@/lib/content-types";

export const metadata = { title: "Review Set" };

const STATUS_STYLES: Record<WorkoutSetStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  denied: "bg-rose-100 text-rose-900",
};

export default async function ReviewWorkoutSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const { data: set } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("id", id)
    .single<WorkoutSet>();

  if (!set) notFound();

  const { data: coach } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", set.created_by)
    .single<{ full_name: string | null }>();

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
          href="/dashboard/workouts/review"
          className="text-muted-foreground hover:text-primary"
        >
          ← Review queue
        </Link>
      </div>

      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold">{set.title}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[set.status]}`}
        >
          {set.status}
        </span>
      </header>
      <p className="mt-1 text-muted-foreground">
        By {coach?.full_name ?? "—"} ·{" "}
        {new Date(set.created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>

      {set.review_comment ? (
        <p className="mt-4 rounded-md border-l-2 border-l-muted-foreground/40 bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">Existing reviewer note:</span>{" "}
          {set.review_comment}
        </p>
      ) : null}

      <section className="mt-8">
        <SetView sections={sections ?? []} />
      </section>

      {set.status === "pending" ? (
        <section className="mt-10 rounded-lg border p-5">
          <h2 className="mb-4 text-lg font-semibold">Decision</h2>
          <ReviewForm setId={set.id} />
        </section>
      ) : null}
    </div>
  );
}
