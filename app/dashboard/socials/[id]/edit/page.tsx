import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { SocialForm } from "@/components/admin/social-form";
import type { Social } from "@/lib/content-types";

export const metadata = { title: "Edit Social" };

export default async function EditSocialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const { data: social } = await supabase
    .from("socials")
    .select("*")
    .eq("id", id)
    .single<Social>();
  if (!social) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/socials/manage"
          className="text-muted-foreground hover:text-primary"
        >
          ← Plan a social
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit social</h1>
      <p className="mt-1 text-muted-foreground">{social.title}</p>

      <section className="mt-8 rounded-lg border p-5">
        <SocialForm social={social} />
      </section>
    </div>
  );
}
