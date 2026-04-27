"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import type {
  WorkoutSectionType,
  WorkoutSetStatus,
} from "@/lib/content-types";

type FormState = { error?: string; success?: string };

const SECTION_TYPES: WorkoutSectionType[] = [
  "warmup",
  "preset",
  "kick",
  "pull",
  "main",
  "sprint",
];

type SectionPayload = {
  section_type: WorkoutSectionType;
  display_order: number;
  content: string;
  total_yardage: number | null;
};

function parseSections(raw: FormDataEntryValue | null): SectionPayload[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Sections payload must be valid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Sections payload must be an array");
  }
  const out: SectionPayload[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const r = parsed[i] as Record<string, unknown>;
    const section_type = r?.section_type;
    if (
      typeof section_type !== "string" ||
      !SECTION_TYPES.includes(section_type as WorkoutSectionType)
    ) {
      throw new Error(`Section ${i + 1} has an invalid type`);
    }
    const content = typeof r?.content === "string" ? r.content : "";
    let total_yardage: number | null = null;
    if (r?.total_yardage !== null && r?.total_yardage !== undefined && r.total_yardage !== "") {
      const n = Number(r.total_yardage);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        throw new Error(`Section ${i + 1} yardage must be a non-negative integer`);
      }
      total_yardage = n;
    }
    out.push({
      section_type: section_type as WorkoutSectionType,
      display_order: i,
      content,
      total_yardage,
    });
  }
  return out;
}

export async function upsertWorkoutSetAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("coach");
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required" };

  let sections: SectionPayload[];
  try {
    sections = parseSections(formData.get("sections"));
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (sections.length === 0) {
    return { error: "Add at least one section before submitting" };
  }

  const idRaw = formData.get("id");
  const isUpdate = typeof idRaw === "string" && idRaw.length > 0;

  let setId: string;
  if (isUpdate) {
    const { error } = await auth.supabase
      .from("workout_sets")
      .update({ title, status: "pending", reviewer_id: null, review_comment: null })
      .eq("id", idRaw)
      .eq("created_by", auth.userId);
    if (error) return { error: error.message };
    setId = idRaw as string;

    // Replace all sections.
    const { error: delError } = await auth.supabase
      .from("workout_sections")
      .delete()
      .eq("set_id", setId);
    if (delError) return { error: delError.message };
  } else {
    const { data, error } = await auth.supabase
      .from("workout_sets")
      .insert({ title, created_by: auth.userId })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: error?.message ?? "Save failed" };
    setId = data.id;
  }

  const sectionRows = sections.map((s) => ({ ...s, set_id: setId }));
  const { error: insError } = await auth.supabase
    .from("workout_sections")
    .insert(sectionRows);
  if (insError) return { error: insError.message };

  revalidatePath("/dashboard/workouts/mine");
  revalidatePath("/dashboard/workouts/review");
  revalidatePath("/dashboard/workouts/bank");
  redirect("/dashboard/workouts/mine?submitted=1");
}

export async function deleteWorkoutSetAction(formData: FormData): Promise<void> {
  const auth = await getAuthedClient("coach");
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase
    .from("workout_sets")
    .delete()
    .eq("id", id)
    .eq("created_by", auth.userId);

  revalidatePath("/dashboard/workouts/mine");
  revalidatePath("/dashboard/workouts/review");
  revalidatePath("/dashboard/workouts/bank");
}

export async function reviewWorkoutSetAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing set id" };
  }
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "denied") {
    return { error: "Decision must be approve or deny" };
  }
  const comment = String(formData.get("review_comment") ?? "").trim();

  const status = decision as WorkoutSetStatus;
  const { error } = await auth.supabase
    .from("workout_sets")
    .update({
      status,
      reviewer_id: auth.userId,
      review_comment: comment === "" ? null : comment,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/workouts/review");
  revalidatePath("/dashboard/workouts/bank");
  revalidatePath("/dashboard/workouts/mine");
  redirect("/dashboard/workouts/review?reviewed=1");
}
