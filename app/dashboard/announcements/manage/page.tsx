import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAnnouncementAction,
  toggleAnnouncementPublishedAction,
} from "@/app/actions/announcements";
import type { WeeklyAnnouncement } from "@/lib/content-types";

export const metadata = { title: "Manage Announcements" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ManageAnnouncementsPage() {
  await requireMinRole("officer");

  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("weekly_announcements")
    .select("*")
    .order("received_at", { ascending: false })
    .returns<WeeklyAnnouncement[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Manage announcements</h1>
      <p className="mt-1 text-muted-foreground">
        New rows usually arrive automatically via the inbound-email webhook.
        Use the form below as a manual fallback.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">New announcement</h2>
        <AnnouncementForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All announcements</h2>
        {!announcements || announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(a.received_at)}
                    </TableCell>
                    <TableCell className="font-medium">{a.subject}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.sender ?? "—"}
                    </TableCell>
                    <TableCell>
                      <form action={toggleAnnouncementPublishedAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={String(!a.is_published)}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={a.is_published ? "default" : "outline"}
                        >
                          {a.is_published ? "Published" : "Draft"}
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/announcements/${a.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteAnnouncementAction}
                        id={a.id}
                        confirmMessage={`Delete "${a.subject}"?`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
