import { createClient } from "@/lib/supabase/server";
import { hasRoleAtLeast } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

export type ActionResult<T = void> = T extends void
  ? { error?: string; success?: string }
  : { error?: string; success?: string; data?: T };

type AuthorizedClient = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: UserRole;
};

/**
 * Returns an authorized supabase client when the caller meets `min`, or an
 * error result otherwise. RLS is the real gate; this is belt-and-suspenders
 * and gives server actions a quick early-return path.
 *
 * Default minimum is 'officer' to match the existing officer/admin tables.
 */
export async function getAuthedClient(
  min: UserRole = "officer",
): Promise<AuthorizedClient | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  if (!profile || !hasRoleAtLeast(profile.role, min)) {
    return { error: "Not authorized" };
  }

  return { supabase, userId: user.id, role: profile.role };
}

/** @deprecated Use getAuthedClient() — kept so existing callers keep compiling. */
export const getAdminClient = getAuthedClient;
