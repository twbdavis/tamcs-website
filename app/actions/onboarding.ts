"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClassYear } from "@/lib/types";

type FormState = { error?: string; success?: string };

const CLASS_YEARS: ClassYear[] = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "5th Year",
  "Graduate",
];

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

export async function completeOnboardingAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  let patch;
  try {
    const first_name = required(formData.get("first_name"), "First name");
    const last_name = required(formData.get("last_name"), "Last name");
    const birthday = required(formData.get("birthday"), "Birthday");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return { error: "Birthday must be a valid date" };
    }
    const class_year = required(formData.get("class_year"), "Class year");
    if (!CLASS_YEARS.includes(class_year as ClassYear)) {
      return { error: "Invalid class year" };
    }
    const uin = required(formData.get("uin"), "UIN");
    if (!/^\d{9}$/.test(uin)) {
      return { error: "UIN must be exactly 9 digits" };
    }
    const phone_number = required(formData.get("phone_number"), "Phone number");
    const phoneDigits = phone_number.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return { error: "Phone number must be 7–15 digits" };
    }
    const constitution = formData.get("constitution_agreed");
    if (constitution !== "on" && constitution !== "true") {
      return {
        error: "You must agree to the TAMCS Constitution to continue.",
      };
    }

    patch = {
      first_name,
      last_name,
      birthday,
      class_year,
      uin,
      phone_number,
      constitution_agreed: true,
      onboarding_completed: true,
      // Keep full_name in sync so other UI (officer page, dropdowns) is correct.
      full_name: `${first_name} ${last_name}`.trim(),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  // Use upsert + a final check so the action can self-heal a missing
  // profile row (e.g. account predates handle_new_user trigger) and so we
  // never redirect to /dashboard while onboarding_completed is still false.
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        ...patch,
      },
      { onConflict: "id" },
    );

  if (upsertError) return { error: upsertError.message };

  const { data: confirmed } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle<{ onboarding_completed: boolean | null }>();
  if (confirmed?.onboarding_completed !== true) {
    return {
      error:
        "We couldn't save your onboarding info. Please try again or contact an officer.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roster");
  // New athlete signups land on /pending until an officer approves them;
  // the middleware will keep redirecting until account_approved flips.
  redirect("/pending");
}
