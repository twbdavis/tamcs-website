import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { BankList } from "@/components/workouts/bank-list";
import type {
  WorkoutSection,
  WorkoutSet,
  WorkoutSetWithSections,
} from "@/lib/content-types";

export const metadata = { title: "Workout Bank" };

export default async function WorkoutBankPage() {
  await requireMinRole("coach");

  const supabase = await createClient();
  // Pull approved sets and their sections in two queries; group in JS to
  // avoid relying on PostgREST embedded resources here.
  const { data: sets } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .returns<WorkoutSet[]>();

  const ids = (sets ?? []).map((s) => s.id);
  const { data: sections } = ids.length
    ? await supabase
        .from("workout_sections")
        .select("*")
        .in("set_id", ids)
        .order("display_order")
        .returns<WorkoutSection[]>()
    : { data: [] as WorkoutSection[] };

  const sectionsBySet = new Map<string, WorkoutSection[]>();
  for (const sec of sections ?? []) {
    const list = sectionsBySet.get(sec.set_id) ?? [];
    list.push(sec);
    sectionsBySet.set(sec.set_id, list);
  }
  const enriched: WorkoutSetWithSections[] = (sets ?? []).map((s) => ({
    ...s,
    sections: sectionsBySet.get(s.id) ?? [],
  }));

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
      <h1 className="text-3xl font-bold">Workout bank</h1>
      <p className="mt-1 text-muted-foreground">
        Approved sets from across the coaching staff. Search by title, filter
        by section type, and click a card to view the full set.
      </p>

      <div className="mt-8">
        <BankList sets={enriched} />
      </div>
    </div>
  );
}
