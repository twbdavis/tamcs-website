import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import type { WeeklyAnnouncement } from "@/lib/content-types";

export const metadata = { title: "Edit Announcement" };

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const { data: announcement } = await supabase
    .from("weekly_announcements")
    .select("*")
    .eq("id", id)
    .single<WeeklyAnnouncement>();

  if (!announcement) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/announcements/manage"
          className="text-muted-foreground hover:text-primary"
        >
          ← Manage announcements
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit announcement</h1>
      <p className="mt-1 text-muted-foreground">{announcement.subject}</p>

      <section className="mt-8 rounded-lg border p-5">
        <AnnouncementForm announcement={announcement} />
      </section>
    </div>
  );
}
