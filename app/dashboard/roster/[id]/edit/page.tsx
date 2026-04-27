import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { ProfileEditForm } from "@/components/admin/profile-edit-form";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Edit Profile" };

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single<Profile>();

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/roster"
          className="text-muted-foreground hover:text-primary"
        >
          ← Roster
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit profile</h1>
      <p className="mt-1 text-muted-foreground">
        Editing{" "}
        <span className="font-medium">
          {profile.full_name ?? profile.email}
        </span>
        . Roles are managed separately by admins and the president.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <ProfileEditForm profile={profile} />
      </section>
    </div>
  );
}
