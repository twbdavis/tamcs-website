"use server";

import { revalidatePath } from "next/cache";
import { getAuthedClient } from "@/lib/auth/require-admin-action";

type FormState = { error?: string; success?: string };

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

// ─── coach roster (president only) ──────────────────────────────────────────

export async function addCoachAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return { error: auth.error };

  let name: string;
  try {
    name = required(formData.get("name"), "Name");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase.from("coaches").insert({ name });
  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  return { success: "Coach added." };
}

export async function removeCoachAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("coaches").delete().eq("id", id);
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
}

// ─── per-practice assignment toggle ─────────────────────────────────────────

export async function toggleCoachAssignmentAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return;

  const scheduleId = formData.get("schedule_id");
  const coachId = formData.get("coach_id");
  const next = formData.get("next"); // "true" | "false"
  if (
    typeof scheduleId !== "string" ||
    typeof coachId !== "string" ||
    (next !== "true" && next !== "false")
  ) {
    return;
  }

  if (next === "true") {
    await auth.supabase
      .from("coaching_schedule_coaches")
      .upsert(
        { schedule_id: scheduleId, coach_id: coachId },
        { onConflict: "schedule_id,coach_id", ignoreDuplicates: true },
      );
  } else {
    await auth.supabase
      .from("coaching_schedule_coaches")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("coach_id", coachId);
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
}
