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

type RawEntry = Record<string, unknown>;

function normalizeEntries(parsed: unknown): {
  entries?: { event: string; swimmer: string; time: string }[];
  error?: string;
} {
  if (!Array.isArray(parsed)) {
    return { error: "Results must be a JSON array" };
  }
  const out: { event: string; swimmer: string; time: string }[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const r = parsed[i] as RawEntry;
    const event = typeof r?.event === "string" ? r.event.trim() : "";
    const swimmer = typeof r?.swimmer === "string" ? r.swimmer.trim() : "";
    const time = typeof r?.time === "string" ? r.time.trim() : "";
    if (!event || !swimmer || !time) {
      return {
        error: `Entry #${i + 1} is missing event, swimmer, or time`,
      };
    }
    out.push({ event, swimmer, time });
  }
  return { entries: out };
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
    let entries: { event: string; swimmer: string; time: string }[] = [];
    if (resultsRaw) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(resultsRaw);
      } catch {
        return { error: "Results must be valid JSON" };
      }
      const norm = normalizeEntries(parsed);
      if (norm.error) return { error: norm.error };
      entries = norm.entries ?? [];
    }

    const overallRaw = nullable(formData.get("overall_place"));
    let overall_place: number | null = null;
    if (overallRaw !== null) {
      const n = Number(overallRaw);
      if (!Number.isInteger(n) || n < 1) {
        return { error: "Overall place must be a positive integer" };
      }
      overall_place = n;
    }

    payload = {
      meet_name: required(formData.get("meet_name"), "Meet name"),
      date: required(formData.get("date"), "Date"),
      location: nullable(formData.get("location")),
      overall_place,
      results: entries,
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
