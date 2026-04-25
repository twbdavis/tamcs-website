import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> = T extends void
  ? { error?: string; success?: string }
  : { error?: string; success?: string; data?: T };

/**
 * For server actions that mutate officer/admin-only resources.
 * Returns the supabase client when authorized, or an error result otherwise.
 * Belt-and-suspenders only — RLS is the real gate.
 */
export async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["officer", "admin"].includes(profile.role)) {
    return { error: "Not authorized" } as const;
  }

  return { supabase } as const;
}
