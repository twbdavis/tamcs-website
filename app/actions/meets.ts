"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import type { MeetAttachment } from "@/lib/content-types";

type FormState = { error?: string; success?: string };

function nullable(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

function parseAttachments(raw: FormDataEntryValue | null): MeetAttachment[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Attachments must be valid JSON");
  }
  if (!Array.isArray(parsed)) return [];
  const out: MeetAttachment[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const url = typeof r.url === "string" ? r.url.trim() : "";
    if (name && url) out.push({ name, url });
  }
  return out;
}

export async function upsertMeetAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const meet_date = required(formData.get("meet_date"), "Meet date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meet_date)) {
      return { error: "Meet date must be a valid date" };
    }
    const signup_deadline_raw = nullable(formData.get("signup_deadline"));
    let signup_deadline: string | null = null;
    if (signup_deadline_raw) {
      const d = new Date(signup_deadline_raw);
      if (Number.isNaN(d.getTime())) {
        return { error: "Signup deadline must be a valid date/time" };
      }
      signup_deadline = d.toISOString();
    }

    const publishedRaw = formData.get("is_published");
    const is_published =
      publishedRaw === "on" || publishedRaw === "true";

    const signup_form_id_raw = nullable(formData.get("signup_form_id"));
    // UUID shape check; reject anything that isn't a plausible id.
    let signup_form_id: string | null = null;
    if (signup_form_id_raw) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          signup_form_id_raw,
        )
      ) {
        return { error: "Signup form id must be a valid UUID" };
      }
      signup_form_id = signup_form_id_raw;
    }

    payload = {
      title: required(formData.get("title"), "Title"),
      meet_date,
      location: required(formData.get("location"), "Location"),
      description: nullable(formData.get("description")),
      signup_url: nullable(formData.get("signup_url")),
      signup_form_id,
      signup_deadline,
      travel_info: nullable(formData.get("travel_info")),
      warmup_time: nullable(formData.get("warmup_time")),
      event_start_time: nullable(formData.get("event_start_time")),
      attachments_urls: parseAttachments(formData.get("attachments_urls")),
      is_published,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { data, error } = isUpdate
    ? await auth.supabase
        .from("meets")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single<{ id: string }>()
    : await auth.supabase
        .from("meets")
        .insert({ ...payload, created_by: auth.userId })
        .select("id")
        .single<{ id: string }>();

  if (error || !data) return { error: error?.message ?? "Save failed" };

  revalidatePath("/dashboard/meets/manage");
  revalidatePath("/dashboard/meets");
  revalidatePath("/dashboard");
  revalidatePath("/meets");
  if (!isUpdate) {
    redirect(`/dashboard/meets/${data.id}/edit`);
  }
  return { success: "Saved." };
}

export async function deleteMeetAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("meets").delete().eq("id", id);
  revalidatePath("/dashboard/meets/manage");
  revalidatePath("/dashboard/meets");
  revalidatePath("/dashboard");
  revalidatePath("/meets");
}

export async function toggleMeetPublishedAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const next = formData.get("next") === "true";

  await auth.supabase
    .from("meets")
    .update({ is_published: next })
    .eq("id", id);

  revalidatePath("/dashboard/meets/manage");
  revalidatePath("/dashboard/meets");
  revalidatePath("/dashboard");
  revalidatePath("/meets");
}
