"use server";

import { revalidatePath } from "next/cache";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import type { AvailabilityDay } from "@/lib/content-types";

type FormState = { error?: string; success?: string };

const DAYS: AvailabilityDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function parseTime(v: FormDataEntryValue | null, name: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    throw new Error(`${name} must be HH:MM`);
  }
  return s;
}

export async function addAvailabilityAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const day = String(formData.get("day_of_week") ?? "");
    if (!DAYS.includes(day as AvailabilityDay)) {
      return { error: "Invalid day of week" };
    }
    const start_time = parseTime(formData.get("start_time"), "Start time");
    const end_time = parseTime(formData.get("end_time"), "End time");
    if (end_time <= start_time) {
      return { error: "End time must be after start time" };
    }
    payload = {
      user_id: auth.userId,
      day_of_week: day,
      start_time,
      end_time,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase.from("availability").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/availability");
  return { success: "Availability added." };
}

export async function deleteAvailabilityAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // RLS already restricts to own rows; the eq is just defense in depth.
  await auth.supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);

  revalidatePath("/dashboard/availability");
}
