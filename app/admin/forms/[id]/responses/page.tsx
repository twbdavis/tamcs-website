import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ResponsesCsvButton } from "@/components/admin/responses-csv-button";
import type {
  Form,
  FormField,
  FormResponse,
  FormResponseValue,
} from "@/lib/content-types";

export const metadata = { title: "Responses" };

type ProfileLite = { id: string; full_name: string | null; email: string };

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const [
    { data: form },
    { data: fields },
    { data: responses },
  ] = await Promise.all([
    supabase.from("forms").select("*").eq("id", id).single<Form>(),
    supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", id)
      .order("display_order", { ascending: true })
      .returns<FormField[]>(),
    supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", id)
      .order("submitted_at", { ascending: false })
      .returns<FormResponse[]>(),
  ]);

  if (!form) notFound();

  const responseIds = (responses ?? []).map((r) => r.id);
  const respondentIds = Array.from(
    new Set((responses ?? []).map((r) => r.respondent_id)),
  );

  const [{ data: values }, { data: profiles }] = await Promise.all([
    responseIds.length
      ? supabase
          .from("form_response_values")
          .select("*")
          .in("response_id", responseIds)
          .returns<FormResponseValue[]>()
      : Promise.resolve({ data: [] as FormResponseValue[] }),
    respondentIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", respondentIds)
          .returns<ProfileLite[]>()
      : Promise.resolve({ data: [] as ProfileLite[] }),
  ]);

  const valuesByResponse = new Map<string, Map<string, string | null>>();
  for (const v of values ?? []) {
    let inner = valuesByResponse.get(v.response_id);
    if (!inner) {
      inner = new Map();
      valuesByResponse.set(v.response_id, inner);
    }
    inner.set(v.field_id, v.value);
  }
  const profileById = new Map<string, ProfileLite>();
  for (const p of profiles ?? []) profileById.set(p.id, p);

  const formattedRows = (responses ?? []).map((r) => {
    const profile = profileById.get(r.respondent_id);
    const inner = valuesByResponse.get(r.id) ?? new Map();
    const cells = (fields ?? []).map((f) => formatCell(inner.get(f.id) ?? ""));
    return {
      id: r.id,
      submittedAt: new Date(r.submitted_at).toLocaleString(),
      respondent: profile?.full_name ?? profile?.email ?? "Unknown",
      cells,
    };
  });

  const csvHeaders = [
    "Submitted at",
    "Respondent",
    ...(fields ?? []).map((f) => f.label),
  ];
  const csvRows = formattedRows.map((r) => [
    r.submittedAt,
    r.respondent,
    ...r.cells,
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href={`/admin/forms/${form.id}/edit`}
          className="text-muted-foreground hover:text-primary"
        >
          ← Edit form
        </Link>
      </div>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Responses</h1>
          <p className="mt-1 text-muted-foreground">
            {form.title} · {(responses ?? []).length} submission
            {(responses ?? []).length === 1 ? "" : "s"}
          </p>
        </div>
        <ResponsesCsvButton
          filename={`${slugify(form.title)}-responses.csv`}
          headers={csvHeaders}
          rows={csvRows}
        />
      </header>

      <section className="mt-8">
        {formattedRows.length === 0 ? (
          <p className="text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="whitespace-nowrap">Respondent</TableHead>
                  {(fields ?? []).map((f) => (
                    <TableHead key={f.id} className="whitespace-nowrap">
                      {f.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {r.submittedAt}
                    </TableCell>
                    <TableCell>{r.respondent}</TableCell>
                    {r.cells.map((cell, i) => (
                      <TableCell
                        key={i}
                        className="max-w-[280px] whitespace-pre-wrap text-sm"
                      >
                        {cell}
                      </TableCell>
                    ))}
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

// Checkbox values are stored as JSON arrays; everything else is plain text.
function formatCell(raw: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch {
      // fall through and return raw
    }
  }
  return raw;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "form"
  );
}
