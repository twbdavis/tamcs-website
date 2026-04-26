"use server";

import { revalidatePath } from "next/cache";
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

export async function upsertOfficerAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("admin");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    payload = {
      name: required(formData.get("name"), "Name"),
      role: required(formData.get("role"), "Role"),
      email: nullable(formData.get("email")),
      year: nullable(formData.get("year")),
      photo_url: nullable(formData.get("photo_url")),
      bio: nullable(formData.get("bio")),
      display_order: Number(formData.get("display_order") || 0) || 0,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("officers").update(payload).eq("id", id)
    : await auth.supabase.from("officers").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/officers");
  revalidatePath("/officers");
  return { success: isUpdate ? "Officer updated." : "Officer added." };
}

export async function deleteOfficerAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("admin");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("officers").delete().eq("id", id);
  revalidatePath("/admin/officers");
  revalidatePath("/officers");
}
