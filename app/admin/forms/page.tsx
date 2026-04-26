import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { CreateFormButton } from "@/components/admin/create-form-button";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  deleteFormAction,
  togglePublishedAction,
} from "@/app/actions/forms";
import type { Form } from "@/lib/content-types";

export const metadata = { title: "Forms" };

export default async function AdminFormsPage() {
  await requireMinRole("officer");

  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Form[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Forms</h1>
      <p className="mt-1 text-muted-foreground">
        Build forms, collect responses, export results.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">New form</h2>
        <CreateFormButton />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All forms</h2>
        {!forms || forms.length === 0 ? (
          <p className="text-muted-foreground">No forms yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.title}
                      {f.description ? (
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {f.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <form action={togglePublishedAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={String(!f.is_published)}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={f.is_published ? "default" : "outline"}
                        >
                          {f.is_published ? "Published" : "Draft"}
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(f.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/forms/${f.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/forms/${f.id}/responses`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Responses
                      </Link>
                      <DeleteButton
                        action={deleteFormAction}
                        id={f.id}
                        confirmMessage={`Delete "${f.title}" and all responses?`}
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

