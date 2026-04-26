import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { FormMetaForm } from "@/components/admin/form-meta-form";
import { NewFieldForm } from "@/components/admin/form-field-editor";
import { FormFieldRow } from "@/components/admin/form-field-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { togglePublishedAction } from "@/app/actions/forms";
import type { Form, FormField } from "@/lib/content-types";

export const metadata = { title: "Edit Form" };

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: form }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", id).single<Form>(),
    supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", id)
      .order("display_order", { ascending: true })
      .returns<FormField[]>(),
  ]);

  if (!form) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/forms"
          className="text-muted-foreground hover:text-primary"
        >
          ← Forms
        </Link>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{form.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.is_published
              ? "Published — accepting responses."
              : "Draft — not visible to members."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/forms/${form.id}/preview`}
            className={buttonVariants({ variant: "outline" })}
          >
            Preview
          </Link>
          <Link
            href={`/admin/forms/${form.id}/responses`}
            className={buttonVariants({ variant: "outline" })}
          >
            Responses
          </Link>
          <form action={togglePublishedAction}>
            <input type="hidden" name="id" value={form.id} />
            <input
              type="hidden"
              name="next"
              value={String(!form.is_published)}
            />
            <Button type="submit">
              {form.is_published ? "Unpublish" : "Publish"}
            </Button>
          </form>
        </div>
      </header>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Form details</h2>
        <FormMetaForm form={form} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Fields</h2>
        {!fields || fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add your first field below.
          </p>
        ) : (
          <ol className="grid gap-3">
            {fields.map((f, i) => (
              <FormFieldRow
                key={f.id}
                field={f}
                isFirst={i === 0}
                isLast={i === fields.length - 1}
              />
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add a field</h2>
        <NewFieldForm formId={form.id} />
      </section>
    </div>
  );
}
