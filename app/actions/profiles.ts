"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import { createAdminClient } from "@/lib/supabase/admin";
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

function nullable(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

export async function updateProfileAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing profile id" };
  }

  let patch;
  try {
    const first_name = required(formData.get("first_name"), "First name");
    const last_name = required(formData.get("last_name"), "Last name");
    const email = required(formData.get("email"), "Email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Email must be a valid address" };
    }
    const birthday = nullable(formData.get("birthday"));
    if (birthday !== null && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return { error: "Birthday must be a valid date" };
    }
    const class_year_raw = nullable(formData.get("class_year"));
    if (
      class_year_raw !== null &&
      !CLASS_YEARS.includes(class_year_raw as ClassYear)
    ) {
      return { error: "Invalid class year" };
    }
    const uin = nullable(formData.get("uin"));
    if (uin !== null && !/^\d{9}$/.test(uin)) {
      return { error: "UIN must be exactly 9 digits" };
    }
    const phone_number = nullable(formData.get("phone_number"));
    if (phone_number !== null) {
      const digits = phone_number.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        return { error: "Phone number must be 7–15 digits" };
      }
    }

    patch = {
      first_name,
      last_name,
      email,
      birthday,
      class_year: class_year_raw,
      uin,
      phone_number,
      full_name: `${first_name} ${last_name}`.trim(),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/roster");
  redirect("/dashboard/roster");
}

export async function approveProfileAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing profile id" };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ account_approved: true })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/roster");
  return { success: "Account approved." };
}

export async function denyProfileAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing profile id" };
  }
  if (id === auth.userId) {
    return { error: "You cannot deny your own account." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: (e as Error).message };
  }

  // Delete the auth user; the profile row cascades via the FK that
  // references auth.users(id) on delete.
  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) {
    // Fall back to deleting just the profile row if the auth delete fails
    // (e.g. row already gone) — the profile is what gates access anyway.
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", id);
    if (profileError) return { error: authError.message };
  }

  revalidatePath("/dashboard/roster");
  return { success: "Registration denied." };
}
