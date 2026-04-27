"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";

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

function revalidateAll() {
  revalidatePath("/dashboard/socials");
  revalidatePath("/dashboard/socials/manage");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function upsertSocialAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const event_date = required(formData.get("event_date"), "Event date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return { error: "Event date must be a valid date" };
    }
    const publishedRaw = formData.get("is_published");
    const is_published =
      publishedRaw === "on" || publishedRaw === "true";
    payload = {
      title: required(formData.get("title"), "Title"),
      description: nullable(formData.get("description")),
      event_date,
      event_time: nullable(formData.get("event_time")),
      location: nullable(formData.get("location")),
      is_published,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("socials").update(payload).eq("id", id)
    : await auth.supabase
        .from("socials")
        .insert({ ...payload, created_by: auth.userId });
  if (error) return { error: error.message };

  revalidateAll();
  redirect("/dashboard/socials/manage");
}

export async function deleteSocialAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await auth.supabase.from("socials").delete().eq("id", id);
  revalidateAll();
}

export async function toggleSocialPublishedAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const next = formData.get("next") === "true";
  await auth.supabase.from("socials").update({ is_published: next }).eq("id", id);
  revalidateAll();
}
