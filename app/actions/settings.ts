"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type FormState = { error?: string; success?: string };

function nullable(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

// Athlete-side self-update for the optional contact fields. Unlike the
// officer-edit action, this never touches name/email/role/etc — only the
// fields the user is allowed to manage on their own row.
export async function updateMySettingsAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const phone = nullable(formData.get("phone_number"));
  if (phone !== null) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return { error: "Phone number must be 7–15 digits" };
    }
  }
  const ig = nullable(formData.get("instagram_handle"));
  if (ig && ig.length > 60) return { error: "Instagram handle is too long" };
  const sc = nullable(formData.get("snapchat_handle"));
  if (sc && sc.length > 60) return { error: "Snapchat handle is too long" };
  const li = nullable(formData.get("linkedin_handle"));
  if (li && li.length > 200) return { error: "LinkedIn handle is too long" };

  // Visibility flags drive whether each field shows up in the
  // /dashboard/team-socials directory. Unchecked checkboxes simply omit
  // the form field, so coerce missing values to false.
  const show_phone = formData.get("show_phone") === "on";
  const show_instagram = formData.get("show_instagram") === "on";
  const show_snapchat = formData.get("show_snapchat") === "on";
  const show_linkedin = formData.get("show_linkedin") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({
      phone_number: phone,
      instagram_handle: ig,
      snapchat_handle: sc,
      linkedin_handle: li,
      show_phone,
      show_instagram,
      show_snapchat,
      show_linkedin,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard/team-socials");
  return { success: "Settings saved." };
}
