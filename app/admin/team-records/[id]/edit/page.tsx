import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamRecordForm } from "@/components/admin/team-record-form";
import type { TeamRecord } from "@/lib/content-types";

export const metadata = { title: "Edit Team Record" };

export default async function EditTeamRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: record } = await supabase
    .from("team_records")
    .select("*")
    .eq("id", id)
    .single<TeamRecord>();

  if (!record) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/team-records"
          className="text-muted-foreground hover:text-primary"
        >
          ← Team Records
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit team record</h1>

      <section className="mt-8 rounded-lg border p-5">
        <TeamRecordForm
          record={record}
          redirectAfterSave="/admin/team-records"
        />
      </section>
    </div>
  );
}
