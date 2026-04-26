import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { MeetForm } from "@/components/admin/meet-form";
import type { Meet } from "@/lib/content-types";

export const metadata = { title: "Edit Meet" };

export default async function EditMeetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const { data: meet } = await supabase
    .from("meets")
    .select("*")
    .eq("id", id)
    .single<Meet>();

  if (!meet) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/meets/manage"
          className="text-muted-foreground hover:text-primary"
        >
          ← Manage meets
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit meet</h1>
      <p className="mt-1 text-muted-foreground">{meet.title}</p>

      <section className="mt-8 rounded-lg border p-5">
        <MeetForm meet={meet} />
      </section>
    </div>
  );
}
