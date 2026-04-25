import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScheduleForm } from "@/components/admin/schedule-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteScheduleEventAction } from "@/app/actions/schedule";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type { ScheduleEvent } from "@/lib/content-types";

export const metadata = { title: "Manage Schedule" };

export default async function AdminSchedulePage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("schedule_events")
    .select("*")
    .order("date", { ascending: true })
    .returns<ScheduleEvent[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Schedule</h1>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add new event</h2>
        <ScheduleForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All events</h2>
        {!events || events.length === 0 ? (
          <p className="text-muted-foreground">No events yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell className="capitalize">{e.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.location ?? "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/schedule/${e.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteScheduleEventAction}
                        id={e.id}
                        confirmMessage={`Delete "${e.title}"?`}
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
