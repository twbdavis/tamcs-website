import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { buttonVariants } from "@/components/ui/button";
import type { WorkoutSet, WorkoutSetStatus } from "@/lib/content-types";

export const metadata = { title: "Review Workout Sets" };

type Filter = "pending" | "approved" | "denied";

const TABS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ReviewWorkoutSetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireMinRole("officer");
  const { status: statusParam } = await searchParams;
  const status: Filter = ([
    "pending",
    "approved",
    "denied",
  ] as const).includes(statusParam as Filter)
    ? (statusParam as Filter)
    : "pending";

  const supabase = await createClient();
  const { data: sets } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .returns<WorkoutSet[]>();

  const coachIds = Array.from(
    new Set((sets ?? []).map((s) => s.created_by)),
  );
  const { data: coachProfiles } = coachIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", coachIds)
        .returns<{ id: string; full_name: string | null }[]>()
    : { data: [] as { id: string; full_name: string | null }[] };
  const coachNameById = new Map<string, string | null>();
  for (const p of coachProfiles ?? []) coachNameById.set(p.id, p.full_name);

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
      <h1 className="text-3xl font-bold">Review workout sets</h1>
      <p className="mt-1 text-muted-foreground">
        Approve sets to add them to the shared bank, or deny with feedback.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={`/dashboard/workouts/review?status=${t.key}`}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (active
                  ? "border-[#500000] bg-[#500000] text-white"
                  : "hover:bg-muted")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 grid gap-3">
        {!sets || sets.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No {status} sets.
          </p>
        ) : (
          sets.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/workouts/review/${s.id}`}
              className="group grid gap-1 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold group-hover:text-[#500000]">
                  {s.title} →
                </h2>
                <StatusPill status={s.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                Submitted by {coachNameById.get(s.created_by) ?? "—"} ·{" "}
                {formatDate(s.created_at)}
              </p>
            </Link>
          ))
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/dashboard/workouts/bank"
          className={buttonVariants({ variant: "outline" })}
        >
          Browse the workout bank →
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: WorkoutSetStatus }) {
  const styles: Record<WorkoutSetStatus, string> = {
    pending: "bg-amber-100 text-amber-900",
    approved: "bg-emerald-100 text-emerald-900",
    denied: "bg-rose-100 text-rose-900",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
