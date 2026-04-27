import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { MeetForm } from "@/components/admin/meet-form";
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
  deleteMeetAction,
  toggleMeetPublishedAction,
} from "@/app/actions/meets";
import type { Form, Meet } from "@/lib/content-types";

export const metadata = { title: "Manage Meets" };

export default async function ManageMeetsPage() {
  await requireMinRole("officer");

  const supabase = await createClient();
  const [{ data: meets }, { data: forms }] = await Promise.all([
    supabase
      .from("meets")
      .select("*")
      .order("meet_date", { ascending: false })
      .returns<Meet[]>(),
    supabase
      .from("forms")
      .select("*")
      .order("title", { ascending: true })
      .returns<Form[]>(),
  ]);

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
      <h1 className="text-3xl font-bold">Manage meets</h1>
      <p className="mt-1 text-muted-foreground">
        Build the upcoming-meets feed athletes see. Keep drafts unpublished
        until you&apos;re ready.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">New meet</h2>
        <MeetForm forms={forms ?? []} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All meets</h2>
        {!meets || meets.length === 0 ? (
          <p className="text-muted-foreground">No meets yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meets.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.meet_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.location}
                    </TableCell>
                    <TableCell>
                      <form action={toggleMeetPublishedAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={String(!m.is_published)}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={m.is_published ? "default" : "outline"}
                        >
                          {m.is_published ? "Published" : "Draft"}
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/meets/${m.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteMeetAction}
                        id={m.id}
                        confirmMessage={`Delete "${m.title}"?`}
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
