import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMinRole } from "@/lib/auth/require-role";
import { SetBuilder } from "@/components/workouts/set-builder";

export const metadata = { title: "Create Workout Set" };

export default async function CreateWorkoutSetPage() {
  const { profile } = await requireMinRole("coach");
  // Only coaches can create — RLS enforces this too, but redirect early so
  // officers/president don't see a form they can't submit.
  if (profile?.role !== "coach") {
    redirect("/dashboard/workouts/bank");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Create workout set</h1>
      <p className="mt-1 text-muted-foreground">
        Build a set out of section blocks. Submit it for officer review — once
        approved, it lands in the shared workout bank.
      </p>

      <div className="mt-8">
        <SetBuilder />
      </div>
    </div>
  );
}
