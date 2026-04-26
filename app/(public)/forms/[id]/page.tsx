import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserAndProfile } from "@/lib/auth/require-role";
import { hasRoleAtLeast } from "@/lib/auth/roles";
import { FormRenderer } from "@/components/forms/form-renderer";
import { buttonVariants } from "@/components/ui/button";
import type { Form, FormField } from "@/lib/content-types";

export const metadata = { title: "Form" };

export default async function FillFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getUserAndProfile();

  // Public list lives at /forms; the actual fill experience requires a login.
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/forms/${id}`)}`);
  }

  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single<Form>();

  if (!form) notFound();

  const isOfficer = hasRoleAtLeast(profile?.role, "officer");
  if (!form.is_published && !isOfficer) {
    notFound();
  }

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("display_order", { ascending: true })
    .returns<FormField[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/forms" className="text-muted-foreground hover:text-primary">
          ← All forms
        </Link>
      </div>
      {!form.is_published ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This form is unpublished. Officers can preview it; members can&apos;t
          submit until it&apos;s published.
        </div>
      ) : null}

      <h1 className="text-3xl font-bold">{form.title}</h1>
      {form.description ? (
        <p className="mt-2 text-muted-foreground">{form.description}</p>
      ) : null}

      <section className="mt-8 rounded-lg border p-6">
        {form.is_published ? (
          <FormRenderer formId={form.id} fields={fields ?? []} />
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>This form isn&apos;t accepting responses yet.</p>
            {isOfficer ? (
              <Link
                href={`/admin/forms/${form.id}/preview`}
                className={`mt-3 inline-flex ${buttonVariants({ variant: "outline", size: "sm" })}`}
              >
                Open preview
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
