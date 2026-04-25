import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MeetResultForm } from "@/components/admin/meet-result-form";
import type { MeetResult } from "@/lib/content-types";

export const metadata = { title: "Edit Meet" };

export default async function EditMeetResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: meet } = await supabase
    .from("meet_results")
    .select("*")
    .eq("id", id)
    .single<MeetResult>();

  if (!meet) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/meet-results"
          className="text-muted-foreground hover:text-primary"
        >
          ← Meet Results
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit meet</h1>
      <p className="mt-1 text-muted-foreground">{meet.meet_name}</p>

      <section className="mt-8 rounded-lg border p-5">
        <MeetResultForm meet={meet} redirectAfterSave="/admin/meet-results" />
      </section>
    </div>
  );
}
