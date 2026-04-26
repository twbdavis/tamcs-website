import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { FormRenderer } from "@/components/forms/form-renderer";
import type { Form, FormField } from "@/lib/content-types";

export const metadata = { title: "Preview Form" };

export default async function FormPreviewPage({
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href={`/admin/forms/${form.id}/edit`}
          className="text-muted-foreground hover:text-primary"
        >
          ← Edit
        </Link>
      </div>
      <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Preview mode — submissions are disabled.
      </div>
      <h1 className="text-3xl font-bold">{form.title}</h1>
      {form.description ? (
        <p className="mt-2 text-muted-foreground">{form.description}</p>
      ) : null}

      <section className="mt-8 rounded-lg border p-6">
        <FormRenderer formId={form.id} fields={fields ?? []} preview />
      </section>
    </div>
  );
}
