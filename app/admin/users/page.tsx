import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import {
  ASSIGNABLE_BY_ADMIN,
  ASSIGNABLE_BY_PRESIDENT,
  isPresident,
} from "@/lib/auth/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleSelect } from "@/components/admin/role-select";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Manage Users" };

export default async function AdminUsersPage() {
  const { user, profile } = await requireMinRole("admin");
  const president = isPresident(profile?.role);
  const assignable = president ? ASSIGNABLE_BY_PRESIDENT : ASSIGNABLE_BY_ADMIN;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true })
    .returns<Profile[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">User roles</h1>
      <p className="mt-1 text-muted-foreground">
        {president
          ? "You can assign any role, including president."
          : "Admins can assign any role except president."}
      </p>

      <section className="mt-8">
        {!profiles || profiles.length === 0 ? (
          <p className="text-muted-foreground">No users yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const isSelf = p.id === user.id;
                  // Only the president may touch a president row.
                  const lockedByRole = p.role === "president" && !president;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.full_name ?? "—"}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.email}
                      </TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell className="flex justify-end">
                        {isSelf || lockedByRole ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <RoleSelect
                            userId={p.id}
                            currentRole={p.role}
                            options={assignable}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
