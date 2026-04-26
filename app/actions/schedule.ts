"use server";

import { revalidatePath } from "next/cache";
import { getAuthedClient } from "@/lib/auth/require-admin-action";

type FormState = { error?: string; success?: string };

const ALLOWED_TYPES = ["practice", "dryland", "meeting", "social"] as const;
type ScheduleType = (typeof ALLOWED_TYPES)[number];

function nullable(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

function parseTime(v: FormDataEntryValue | null, name: string): string {
  const s = required(v, name);
  // Browser <input type="time"> gives "HH:MM"; postgres time accepts that.
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    throw new Error(`${name} must be in HH:MM format`);
  }
  return s;
}

export async function upsertCoachingScheduleAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  // President-only. RLS enforces the same constraint server-side.
  const auth = await getAuthedClient("president");
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const type = required(formData.get("type"), "Type") as ScheduleType;
    if (!ALLOWED_TYPES.includes(type)) return { error: "Invalid type" };

    const recurring = formData.get("recurring") === "on" ||
      formData.get("recurring") === "true";

    const dayRaw = formData.get("day_of_week");
    const dayStr = typeof dayRaw === "string" ? dayRaw.trim() : "";
    const day_of_week = dayStr === "" ? null : Number(dayStr);
    if (day_of_week !== null && (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6)) {
      return { error: "Day of week must be between 0 (Sun) and 6 (Sat)" };
    }

    const specific_date = nullable(formData.get("specific_date"));

    if (recurring && day_of_week === null) {
      return { error: "Recurring entries need a day of week" };
    }
    if (!recurring && !specific_date) {
      return { error: "One-off entries need a specific date" };
    }

    const start_time = parseTime(formData.get("start_time"), "Start time");
    const end_time = parseTime(formData.get("end_time"), "End time");
    if (end_time <= start_time) {
      return { error: "End time must be after start time" };
    }

    const effective_from = recurring
      ? nullable(formData.get("effective_from"))
      : null;
    const effective_to = recurring
      ? nullable(formData.get("effective_to"))
      : null;
    if (effective_from && effective_to && effective_to < effective_from) {
      return { error: "Effective until must be on or after effective from" };
    }

    payload = {
      title: required(formData.get("title"), "Title"),
      day_of_week: recurring ? day_of_week : null,
      start_time,
      end_time,
      location: nullable(formData.get("location")),
      type,
      notes: nullable(formData.get("notes")),
      recurring,
      specific_date: recurring ? null : specific_date,
      effective_from,
      effective_to,
      display_order: Number(formData.get("display_order") || 0) || 0,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("coaching_schedule").update(payload).eq("id", id)
    : await auth.supabase.from("coaching_schedule").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  return { success: isUpdate ? "Entry updated." : "Entry added." };
}

export async function deleteCoachingScheduleAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("coaching_schedule").delete().eq("id", id);
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
}

// ─── spreadsheet helpers (president-only) ────────────────────────────────────

const CELL_FIELDS = new Set([
  "title",
  "day_of_week",
  "start_time",
  "end_time",
  "location",
  "type",
  "notes",
  "specific_date",
  "effective_from",
  "effective_to",
]);

/**
 * Single-cell update from the spreadsheet view. Presidents only; RLS is the
 * real gate. Each field is validated/coerced before being patched in.
 */
export async function updatePracticeCellAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  const field = formData.get("field");
  if (typeof id !== "string" || !id) return { error: "Missing id" };
  if (typeof field !== "string" || !CELL_FIELDS.has(field)) {
    return { error: "Unsupported field" };
  }

  const raw = formData.get("value");
  const rawStr = typeof raw === "string" ? raw : "";

  let patch: Record<string, unknown>;
  try {
    switch (field) {
      case "title": {
        const v = rawStr.trim();
        if (!v) return { error: "Title is required" };
        patch = { title: v };
        break;
      }
      case "type": {
        if (!ALLOWED_TYPES.includes(rawStr as ScheduleType)) {
          return { error: "Invalid type" };
        }
        patch = { type: rawStr };
        break;
      }
      case "start_time":
      case "end_time": {
        patch = { [field]: parseTime(raw, field) };
        break;
      }
      case "day_of_week": {
        const n = Number(rawStr);
        if (!Number.isInteger(n) || n < 0 || n > 6) {
          return { error: "Day of week must be 0–6" };
        }
        patch = { day_of_week: n };
        break;
      }
      case "location":
      case "notes": {
        patch = { [field]: rawStr.trim() === "" ? null : rawStr.trim() };
        break;
      }
      case "specific_date":
      case "effective_from":
      case "effective_to": {
        const v = rawStr.trim();
        if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
          return { error: `${field} must be YYYY-MM-DD` };
        }
        patch = { [field]: v === "" ? null : v };
        break;
      }
      default:
        return { error: "Unsupported field" };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase
    .from("coaching_schedule")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  return { success: "Saved." };
}

/**
 * Inserts a sensible-default recurring practice so the president can fill it
 * in via inline cells.
 */
export async function createBlankPracticeAction(): Promise<
  { error: string } | { id: string }
> {
  const auth = await getAuthedClient("president");
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("coaching_schedule")
    .insert({
      title: "New practice",
      type: "practice",
      recurring: true,
      day_of_week: 1,
      start_time: "19:30",
      end_time: "21:00",
      location: "TAMU Natatorium",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return { error: error?.message ?? "Could not create row" };
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  return { id: data.id };
}
