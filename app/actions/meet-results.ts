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

export async function upsertMeetResultAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAdminClient();
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const resultsRaw = nullable(formData.get("results"));
    let results: unknown = [];
    if (resultsRaw) {
      try {
        results = JSON.parse(resultsRaw);
      } catch {
        return { error: "Results must be valid JSON" };
      }
    }
    payload = {
      meet_name: required(formData.get("meet_name"), "Meet name"),
      date: required(formData.get("date"), "Date"),
      location: nullable(formData.get("location")),
      results,
      notes: nullable(formData.get("notes")),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("meet_results").update(payload).eq("id", id)
    : await auth.supabase.from("meet_results").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/meet-results");
  revalidatePath("/meet-results");
  return { success: isUpdate ? "Meet updated." : "Meet added." };
}

export async function deleteMeetResultAction(formData: FormData): Promise<void> {
  const auth = await getAdminClient();
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("meet_results").delete().eq("id", id);
  revalidatePath("/admin/meet-results");
  revalidatePath("/meet-results");
}
