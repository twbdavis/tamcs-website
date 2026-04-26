"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import { createClient } from "@/lib/supabase/server";
import type { FormField, FormFieldType } from "@/lib/content-types";

type FormState = { error?: string; success?: string };

const FIELD_TYPES: FormFieldType[] = [
  "text",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "email",
  "multiple_choice",
];

const TYPES_WITH_OPTIONS: FormFieldType[] = [
  "select",
  "radio",
  "checkbox",
  "multiple_choice",
];

function nullable(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

function parseOptions(raw: FormDataEntryValue | null): string[] {
  // The OptionsEditor serializes a JSON string array; older callers may still
  // pass newline-separated text. Try JSON first, fall back to line split.
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── form CRUD ──────────────────────────────────────────────────────────────

export async function createFormAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  let title: string;
  try {
    title = required(formData.get("title"), "Title");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { data, error } = await auth.supabase
    .from("forms")
    .insert({
      title,
      description: nullable(formData.get("description")),
      created_by: auth.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create form" };

  revalidatePath("/admin/forms");
  redirect(`/admin/forms/${data.id}/edit`);
}

export async function updateFormAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing form id" };

  let title: string;
  try {
    title = required(formData.get("title"), "Title");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase
    .from("forms")
    .update({
      title,
      description: nullable(formData.get("description")),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}/edit`);
  revalidatePath(`/forms/${id}`);
  return { success: "Form updated." };
}

export async function deleteFormAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("forms").delete().eq("id", id);
  revalidatePath("/admin/forms");
  revalidatePath("/forms");
}

export async function togglePublishedAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const next = formData.get("next") === "true";
  await auth.supabase
    .from("forms")
    .update({ is_published: next })
    .eq("id", id);

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}/edit`);
  revalidatePath("/forms");
  revalidatePath(`/forms/${id}`);
}

// ─── field CRUD ─────────────────────────────────────────────────────────────

export async function addFieldAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const formId = formData.get("form_id");
  if (typeof formId !== "string" || !formId) {
    return { error: "Missing form id" };
  }

  let payload;
  try {
    const field_type = required(formData.get("field_type"), "Type") as FormFieldType;
    if (!FIELD_TYPES.includes(field_type)) return { error: "Invalid field type" };

    const label = required(formData.get("label"), "Label");
    const placeholder = nullable(formData.get("placeholder"));
    const is_required = formData.get("is_required") === "on";
    const options = TYPES_WITH_OPTIONS.includes(field_type)
      ? parseOptions(formData.get("options"))
      : [];
    if (TYPES_WITH_OPTIONS.includes(field_type) && options.length === 0) {
      return { error: "Add at least one option (one per line)." };
    }

    // Append at the end.
    const { data: tail } = await auth.supabase
      .from("form_fields")
      .select("display_order")
      .eq("form_id", formId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ display_order: number }>();

    payload = {
      form_id: formId,
      field_type,
      label,
      placeholder,
      options,
      is_required,
      display_order: (tail?.display_order ?? -1) + 1,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase.from("form_fields").insert(payload);
  if (error) return { error: error.message };

  revalidatePath(`/admin/forms/${formId}/edit`);
  return { success: "Field added." };
}

export async function updateFieldAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  const formId = formData.get("form_id");
  if (typeof id !== "string" || !id) return { error: "Missing field id" };
  if (typeof formId !== "string" || !formId) {
    return { error: "Missing form id" };
  }

  let patch;
  try {
    const field_type = required(formData.get("field_type"), "Type") as FormFieldType;
    if (!FIELD_TYPES.includes(field_type)) return { error: "Invalid field type" };

    const label = required(formData.get("label"), "Label");
    const placeholder = nullable(formData.get("placeholder"));
    const is_required = formData.get("is_required") === "on";
    const options = TYPES_WITH_OPTIONS.includes(field_type)
      ? parseOptions(formData.get("options"))
      : [];
    if (TYPES_WITH_OPTIONS.includes(field_type) && options.length === 0) {
      return { error: "Add at least one option (one per line)." };
    }
    patch = { field_type, label, placeholder, is_required, options };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase
    .from("form_fields")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/forms/${formId}/edit`);
  return { success: "Field updated." };
}

export async function deleteFieldAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  const formId = formData.get("form_id");
  if (typeof id !== "string" || typeof formId !== "string") return;

  await auth.supabase.from("form_fields").delete().eq("id", id);
  revalidatePath(`/admin/forms/${formId}/edit`);
}

export async function moveFieldAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  const formId = formData.get("form_id");
  const direction = formData.get("direction"); // "up" | "down"
  if (typeof id !== "string" || typeof formId !== "string") return;
  if (direction !== "up" && direction !== "down") return;

  const { data: fields } = await auth.supabase
    .from("form_fields")
    .select("id, display_order")
    .eq("form_id", formId)
    .order("display_order", { ascending: true })
    .returns<Pick<FormField, "id" | "display_order">[]>();

  if (!fields) return;
  const idx = fields.findIndex((f) => f.id === id);
  if (idx < 0) return;
  const swapWith =
    direction === "up" ? fields[idx - 1] : fields[idx + 1];
  if (!swapWith) return;

  const me = fields[idx];
  // Two updates; RLS only allows officer+ which we already verified.
  await auth.supabase
    .from("form_fields")
    .update({ display_order: swapWith.display_order })
    .eq("id", me.id);
  await auth.supabase
    .from("form_fields")
    .update({ display_order: me.display_order })
    .eq("id", swapWith.id);

  revalidatePath(`/admin/forms/${formId}/edit`);
}

// ─── response submission ────────────────────────────────────────────────────

export async function submitResponseAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  // Members and above. RLS enforces published-form gating server-side too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to submit." };

  const formId = formData.get("form_id");
  if (typeof formId !== "string" || !formId) {
    return { error: "Missing form id" };
  }

  // Re-load fields to validate against the current schema (don't trust the
  // hidden inputs the client sent).
  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("display_order", { ascending: true })
    .returns<FormField[]>();

  if (!fields || fields.length === 0) return { error: "Form has no fields." };

  // Confirm the form is published.
  const { data: form } = await supabase
    .from("forms")
    .select("id, is_published")
    .eq("id", formId)
    .single<{ id: string; is_published: boolean }>();
  if (!form?.is_published) return { error: "Form is not accepting responses." };

  // Validate + flatten values per field.
  const values: { field_id: string; value: string | null }[] = [];
  for (const f of fields) {
    if (f.field_type === "checkbox") {
      const all = formData.getAll(`field_${f.id}`);
      const picks = all.map(String).filter(Boolean);
      if (f.is_required && picks.length === 0) {
        return { error: `${f.label} is required` };
      }
      values.push({ field_id: f.id, value: picks.length ? JSON.stringify(picks) : null });
      continue;
    }

    const raw = formData.get(`field_${f.id}`);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (f.is_required && !s) return { error: `${f.label} is required` };

    if (s && f.field_type === "email") {
      // Cheap email validity check; lets the DB store whatever survives this.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
        return { error: `${f.label} must be a valid email` };
      }
    }
    if (s && f.field_type === "number" && Number.isNaN(Number(s))) {
      return { error: `${f.label} must be a number` };
    }

    values.push({ field_id: f.id, value: s === "" ? null : s });
  }

  // Insert response shell, then values.
  const { data: response, error: respErr } = await supabase
    .from("form_responses")
    .insert({ form_id: formId, respondent_id: user.id })
    .select("id")
    .single<{ id: string }>();

  if (respErr || !response) {
    return { error: respErr?.message ?? "Could not record response" };
  }

  if (values.length > 0) {
    const { error: valErr } = await supabase
      .from("form_response_values")
      .insert(
        values.map((v) => ({ ...v, response_id: response.id })),
      );
    if (valErr) {
      // Best-effort cleanup so we don't leave orphan response shells.
      await supabase.from("form_responses").delete().eq("id", response.id);
      return { error: valErr.message };
    }
  }

  revalidatePath(`/admin/forms/${formId}/responses`);
  return { success: "Response submitted. Thanks!" };
}
