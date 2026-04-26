import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MeetResultForm } from "@/components/admin/meet-result-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMeetResultAction } from "@/app/actions/meet-results";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type { MeetResult } from "@/lib/content-types";

export const metadata = { title: "Manage Meets" };

export default async function AdminMeetResultsPage() {
  const supabase = await createClient();
  const { data: meets } = await supabase
    .from("meet_results")
    .select("*")
    .order("date", { ascending: false })
    .returns<MeetResult[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Meets</h1>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add new meet</h2>
        <MeetResultForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All meets</h2>
        {!meets || meets.length === 0 ? (
          <p className="text-muted-foreground">No meets yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meet</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meets.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.date}</TableCell>
                    <TableCell className="font-medium">{m.meet_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Array.isArray(m.results) ? m.results.length : 0} entries
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/meet-results/${m.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteMeetResultAction}
                        id={m.id}
                        confirmMessage={`Delete "${m.meet_name}"?`}
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
