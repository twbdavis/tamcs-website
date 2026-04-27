"use server";

import { revalidatePath } from "next/cache";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import {
  ASSIGNABLE_BY_ADMIN,
  ASSIGNABLE_BY_PRESIDENT,
  isPresident,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

type FormState = { error?: string; success?: string };

export async function updateUserRoleAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("admin");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  const role = formData.get("role");
  if (typeof id !== "string" || !id) return { error: "Missing user id" };
  if (typeof role !== "string" || !role) return { error: "Missing role" };

  if (id === auth.userId) {
    return { error: "You cannot change your own role." };
  }

  const allowed = isPresident(auth.role)
    ? ASSIGNABLE_BY_PRESIDENT
    : ASSIGNABLE_BY_ADMIN;
  if (!allowed.includes(role as UserRole)) {
    return { error: "You do not have permission to assign that role." };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/dashboard/roster");
  return { success: `Role updated to ${role}` };
}
