import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OfficerForm } from "@/components/admin/officer-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteOfficerAction } from "@/app/actions/officers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type { Officer } from "@/lib/content-types";

export const metadata = { title: "Manage Officers" };

export default async function AdminOfficersPage() {
  const supabase = await createClient();
  const { data: officers } = await supabase
    .from("officers")
    .select("*")
    .order("display_order")
    .order("name")
    .returns<Officer[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Officers</h1>
      <p className="mt-1 text-muted-foreground">
        Manage the team&apos;s executive board.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add new officer</h2>
        <OfficerForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Current officers</h2>
        {!officers || officers.length === 0 ? (
          <p className="text-muted-foreground">No officers yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.display_order}</TableCell>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{o.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.email ?? "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/officers/${o.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteOfficerAction}
                        id={o.id}
                        confirmMessage={`Delete ${o.name}?`}
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
