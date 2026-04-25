import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfficerForm } from "@/components/admin/officer-form";
import type { Officer } from "@/lib/content-types";

export const metadata = { title: "Edit Officer" };

export default async function EditOfficerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: officer } = await supabase
    .from("officers")
    .select("*")
    .eq("id", id)
    .single<Officer>();

  if (!officer) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/officers"
          className="text-muted-foreground hover:text-primary"
        >
          ← Officers
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit officer</h1>
      <p className="mt-1 text-muted-foreground">{officer.name}</p>

      <section className="mt-8 rounded-lg border p-5">
        <OfficerForm officer={officer} redirectAfterSave="/admin/officers" />
      </section>
    </div>
  );
}
