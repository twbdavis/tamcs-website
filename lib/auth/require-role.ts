import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRoleAtLeast } from "@/lib/auth/roles";
import type { Profile, UserRole } from "@/lib/types";

export async function getUserAndProfile(): Promise<
  | { user: null; profile: null }
  | { user: { id: string; email?: string }; profile: Profile | null }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user: { id: user.id, email: user.email ?? undefined }, profile };
}

export async function requireUser() {
  const result = await getUserAndProfile();
  if (!result.user) redirect("/login");
  return result;
}

export async function requireRole(allowed: UserRole[]) {
  const result = await requireUser();
  if (!result.profile || !allowed.includes(result.profile.role)) {
    redirect("/dashboard?error=not_authorized");
  }
  return result;
}

export async function requireMinRole(min: UserRole) {
  const result = await requireUser();
  if (!hasRoleAtLeast(result.profile?.role, min)) {
    redirect("/dashboard?error=not_authorized");
  }
  return result;
}
