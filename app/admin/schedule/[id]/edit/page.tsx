import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScheduleForm } from "@/components/admin/schedule-form";
import type { ScheduleEvent } from "@/lib/content-types";

export const metadata = { title: "Edit Event" };

export default async function EditScheduleEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("id", id)
    .single<ScheduleEvent>();

  if (!event) notFound();

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
      <h1 className="text-3xl font-bold">Edit event</h1>
      <p className="mt-1 text-muted-foreground">{event.title}</p>

      <section className="mt-8 rounded-lg border p-5">
        <ScheduleForm event={event} redirectAfterSave="/admin/schedule" />
      </section>
    </div>
  );
}
