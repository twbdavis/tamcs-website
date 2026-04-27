"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import {
  parseLocalDate,
  parseRoster,
  semesterAndYearFor,
} from "@/lib/attendance";
import type { AttendanceSemester } from "@/lib/content-types";

type FormState = { error?: string; success?: string };

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

function asSemester(v: unknown): AttendanceSemester | null {
  return typeof v === "string" && (SEMESTERS as string[]).includes(v)
    ? (v as AttendanceSemester)
    : null;
}

export async function createAttendanceSessionAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const session_date = String(formData.get("session_date") ?? "").trim();
  const dt = parseLocalDate(session_date);
  if (!dt) return { error: "Pick a valid date" };

  const title = (String(formData.get("title") ?? "Practice").trim() || "Practice");

  const auto = semesterAndYearFor(dt);
  const semester = asSemester(formData.get("semester")) ?? auto.semester;
  const academic_year_raw = String(
    formData.get("academic_year") ?? auto.academic_year,
  ).trim();
  if (!/^\d{4}-\d{4}$/.test(academic_year_raw)) {
    return { error: "Academic year must look like 2025-2026" };
  }

  const rosterRaw = String(formData.get("roster") ?? "");
  const entries = parseRoster(rosterRaw);
  if (entries.length === 0) {
    return { error: "Paste at least one roster line before saving" };
  }

  // Optional: client may send a serialized JSON array of approved entries
  // (already filtered/edited in the preview step). Prefer that if present.
  const approvedJson = formData.get("approved_entries");
  let approved = entries;
  if (typeof approvedJson === "string" && approvedJson.trim() !== "") {
    try {
      const parsed = JSON.parse(approvedJson);
      if (Array.isArray(parsed)) {
        approved = parsed
          .filter(
            (r): r is {
              athlete_name: string;
              uin_last4: string | null;
              is_restricted: boolean;
            } =>
              !!r &&
              typeof r === "object" &&
              typeof (r as Record<string, unknown>).athlete_name === "string",
          )
          .map((r) => ({
            athlete_name: r.athlete_name.trim(),
            uin_last4:
              typeof r.uin_last4 === "string" && /^\d{4}$/.test(r.uin_last4)
                ? r.uin_last4
                : null,
            is_restricted: !!r.is_restricted,
          }))
          .filter((r) => r.athlete_name !== "");
      }
    } catch {
      return { error: "Approved entries payload was not valid JSON" };
    }
  }
  if (approved.length === 0) {
    return { error: "Nothing to save — every row was removed" };
  }

  const { data: session, error: sessionErr } = await auth.supabase
    .from("attendance_sessions")
    .insert({
      session_date,
      title,
      semester,
      academic_year: academic_year_raw,
      created_by: auth.userId,
    })
    .select("id")
    .single<{ id: string }>();
  if (sessionErr || !session) {
    return { error: sessionErr?.message ?? "Failed to create session" };
  }

  const rows = approved.map((r) => ({ ...r, session_id: session.id }));
  const { error: recordsErr } = await auth.supabase
    .from("attendance_records")
    .insert(rows);
  if (recordsErr) {
    // Roll back the session row so we don't leave orphans.
    await auth.supabase.from("attendance_sessions").delete().eq("id", session.id);
    return { error: recordsErr.message };
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
  redirect(
    `/dashboard/attendance?tab=history&saved=${encodeURIComponent(session.id)}`,
  );
}

export async function updateAttendanceSessionMetaAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing session id" };

  const session_date = String(formData.get("session_date") ?? "").trim();
  const dt = parseLocalDate(session_date);
  if (!dt) return { error: "Pick a valid date" };

  const title = String(formData.get("title") ?? "Practice").trim() || "Practice";

  const auto = semesterAndYearFor(dt);
  const semester = asSemester(formData.get("semester")) ?? auto.semester;
  const academic_year = String(
    formData.get("academic_year") ?? auto.academic_year,
  ).trim();
  if (!/^\d{4}-\d{4}$/.test(academic_year)) {
    return { error: "Academic year must look like 2025-2026" };
  }

  const { error } = await auth.supabase
    .from("attendance_sessions")
    .update({ session_date, title, semester, academic_year })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
  return { success: "Session updated." };
}

export async function patchAttendanceRecordAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing record id" };
  const field = String(formData.get("field") ?? "");
  const valueRaw = formData.get("value");

  const patch: Record<string, unknown> = {};
  switch (field) {
    case "athlete_name": {
      const name = String(valueRaw ?? "").trim();
      if (!name) return { error: "Name cannot be empty" };
      patch.athlete_name = name;
      break;
    }
    case "uin_last4": {
      const v = String(valueRaw ?? "").trim();
      if (v === "") {
        patch.uin_last4 = null;
      } else if (/^\d{4}$/.test(v)) {
        patch.uin_last4 = v;
      } else {
        return { error: "UIN last 4 must be exactly 4 digits" };
      }
      break;
    }
    case "is_restricted":
      patch.is_restricted = valueRaw === "true" || valueRaw === "on";
      break;
    default:
      return { error: "Unknown field" };
  }

  const { error } = await auth.supabase
    .from("attendance_records")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
  return { success: "Saved." };
}

export async function deleteAttendanceRecordAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await auth.supabase.from("attendance_records").delete().eq("id", id);
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
}

export async function addAttendanceRecordsAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const session_id = formData.get("session_id");
  if (typeof session_id !== "string" || !session_id) {
    return { error: "Missing session id" };
  }

  const approvedJson = formData.get("approved_entries");
  const rosterRaw = String(formData.get("roster") ?? "");

  let entries: { athlete_name: string; uin_last4: string | null; is_restricted: boolean }[] = [];
  if (typeof approvedJson === "string" && approvedJson.trim() !== "") {
    try {
      const parsed = JSON.parse(approvedJson);
      if (Array.isArray(parsed)) {
        entries = parsed
          .filter(
            (r): r is {
              athlete_name: string;
              uin_last4: string | null;
              is_restricted: boolean;
            } =>
              !!r &&
              typeof r === "object" &&
              typeof (r as Record<string, unknown>).athlete_name === "string",
          )
          .map((r) => ({
            athlete_name: r.athlete_name.trim(),
            uin_last4:
              typeof r.uin_last4 === "string" && /^\d{4}$/.test(r.uin_last4)
                ? r.uin_last4
                : null,
            is_restricted: !!r.is_restricted,
          }))
          .filter((r) => r.athlete_name !== "");
      }
    } catch {
      return { error: "Approved entries payload was not valid JSON" };
    }
  } else if (rosterRaw.trim() !== "") {
    // No preview step — parse the raw paste server-side as a fallback.
    entries = parseRoster(rosterRaw);
  }

  if (entries.length === 0) {
    return { error: "No valid participants to add" };
  }

  // De-dupe against this session's existing records so re-pasting the
  // same roster doesn't create duplicates.
  const { data: existing, error: existingErr } = await auth.supabase
    .from("attendance_records")
    .select("athlete_name, uin_last4")
    .eq("session_id", session_id);
  if (existingErr) return { error: existingErr.message };

  const seen = new Set(
    (existing ?? []).map(
      (r) =>
        `${String(r.athlete_name ?? "").toLowerCase()}|${
          r.uin_last4 == null ? "" : String(r.uin_last4)
        }`,
    ),
  );
  const fresh = entries.filter(
    (r) =>
      !seen.has(
        `${r.athlete_name.toLowerCase()}|${r.uin_last4 ?? ""}`,
      ),
  );
  if (fresh.length === 0) {
    return { success: "Nothing new to add — all entries were already in this session." };
  }

  const rows = fresh.map((r) => ({ ...r, session_id }));
  const { error } = await auth.supabase
    .from("attendance_records")
    .insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
  return {
    success: `Added ${fresh.length} record${fresh.length === 1 ? "" : "s"}.`,
  };
}

export async function fetchSessionRecordsAction(
  sessionId: string,
): Promise<
  | { error: string }
  | {
      records: {
        id: string;
        athlete_name: string;
        uin_last4: string | null;
        is_restricted: boolean;
      }[];
    }
> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { error: "Missing session id" };
  }
  const { data, error } = await auth.supabase
    .from("attendance_records")
    .select("id, athlete_name, uin_last4, is_restricted")
    .eq("session_id", sessionId)
    .order("athlete_name", { ascending: true });
  if (error) return { error: error.message };
  return {
    records: (data ?? []).map((r) => ({
      id: String(r.id),
      athlete_name: String(r.athlete_name ?? ""),
      uin_last4: r.uin_last4 == null ? null : String(r.uin_last4),
      is_restricted: !!r.is_restricted,
    })),
  };
}

export async function deleteAttendanceSessionAction(
  formData: FormData,
): Promise<void> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // ON DELETE CASCADE on attendance_records cleans up child rows.
  await auth.supabase.from("attendance_sessions").delete().eq("id", id);
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/my-attendance");
}
