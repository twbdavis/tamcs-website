import { createClient } from "@supabase/supabase-js";

// Service-role client for actions that have to bypass RLS or hit the auth
// admin API (e.g. permanently deleting a denied account). Server-only —
// never import from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set; admin operations are unavailable.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
