"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";

type FormState = { error?: string; success?: string };

function nullable(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

export async function upsertAnnouncementAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const subject = required(formData.get("subject"), "Subject");
    const body = required(formData.get("body"), "Body");
    const sender = nullable(formData.get("sender"));
    const publishedRaw = formData.get("is_published");
    const is_published =
      publishedRaw === "on" || publishedRaw === "true";
    const receivedRaw = nullable(formData.get("received_at"));
    let received_at: string | null = null;
    if (receivedRaw) {
      const d = new Date(receivedRaw);
      if (Number.isNaN(d.getTime())) {
        return { error: "Received date must be valid" };
      }
      received_at = d.toISOString();
    }
    payload = {
      subject,
      body,
      sender,
      is_published,
      ...(received_at ? { received_at } : {}),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase
        .from("weekly_announcements")
        .update(payload)
        .eq("id", id)
    : await auth.supabase.from("weekly_announcements").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/announcements/manage");
  redirect("/dashboard/announcements/manage");
}

export async function deleteAnnouncementAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("weekly_announcements").delete().eq("id", id);
  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/announcements/manage");
}

export async function toggleAnnouncementPublishedAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const next = formData.get("next") === "true";

  await auth.supabase
    .from("weekly_announcements")
    .update({ is_published: next })
    .eq("id", id);

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/announcements/manage");
}
