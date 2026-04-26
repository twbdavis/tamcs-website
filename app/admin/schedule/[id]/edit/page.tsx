import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScheduleForm } from "@/components/admin/schedule-form";
import { requireMinRole } from "@/lib/auth/require-role";
import type { CoachingScheduleEntry } from "@/lib/content-types";

export const metadata = { title: "Edit Schedule Entry" };

export default async function EditScheduleEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireMinRole("officer");
  if (profile?.role !== "president") {
    redirect("/dashboard?error=schedule_president_only");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("coaching_schedule")
    .select("*")
    .eq("id", id)
    .single<CoachingScheduleEntry>();

  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/schedule"
          className="text-muted-foreground hover:text-primary"
        >
          ← Schedule
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit entry</h1>
      <p className="mt-1 text-muted-foreground">{entry.title}</p>

      <section className="mt-8 rounded-lg border p-5">
        <ScheduleForm entry={entry} redirectAfterSave="/admin/schedule" />
      </section>
    </div>
  );
}
