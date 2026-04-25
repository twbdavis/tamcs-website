"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/auth/require-admin-action";

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

const ALLOWED_TYPES = ["practice", "meet", "social", "other"] as const;

export async function upsertScheduleEventAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAdminClient();
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const type = required(formData.get("type"), "Type");
    if (!ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
      return { error: "Invalid type" };
    }
    const dateStr = required(formData.get("date"), "Date");
    const dateIso = new Date(dateStr).toISOString();

    payload = {
      title: required(formData.get("title"), "Title"),
      date: dateIso,
      location: nullable(formData.get("location")),
      type,
      description: nullable(formData.get("description")),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("schedule_events").update(payload).eq("id", id)
    : await auth.supabase.from("schedule_events").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  return { success: isUpdate ? "Event updated." : "Event added." };
}

export async function deleteScheduleEventAction(formData: FormData): Promise<void> {
  const auth = await getAdminClient();
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("schedule_events").delete().eq("id", id);
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
}
