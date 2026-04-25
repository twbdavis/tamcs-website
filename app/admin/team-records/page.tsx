import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamRecordForm } from "@/components/admin/team-record-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteTeamRecordAction } from "@/app/actions/team-records";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type { TeamRecord } from "@/lib/content-types";

export const metadata = { title: "Manage Team Records" };

export default async function AdminTeamRecordsPage() {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("team_records")
    .select("*")
    .order("category")
    .order("display_order")
    .returns<TeamRecord[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Team Records</h1>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add new record</h2>
        <TeamRecordForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All records</h2>
        {!records || records.length === 0 ? (
          <p className="text-muted-foreground">No records yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Swimmer</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="capitalize">{r.category}</TableCell>
                    <TableCell className="font-medium">{r.event}</TableCell>
                    <TableCell>{r.swimmer_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.year ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono">{r.time}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/team-records/${r.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteTeamRecordAction}
                        id={r.id}
                        confirmMessage={`Delete ${r.category} ${r.event}?`}
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
