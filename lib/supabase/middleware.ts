import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasRoleAtLeast } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

// Paths an authenticated-but-not-onboarded user can still hit. Everything
// else routes back to /onboarding until the form is complete.
const ONBOARDING_ALLOWED_PREFIXES = [
  "/onboarding",
  "/auth", // /auth/callback, /auth/confirm
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api",
];

function bypassesOnboarding(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  // Coaches are added manually by the president, alumni are historical;
  // neither needs to fill out the athlete onboarding form.
  if (role === "coach" || role === "alumni") return true;
  // Officers and above are presumably already onboarded — they were
  // promoted from athlete. Skip just in case.
  return hasRoleAtLeast(role, "officer");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the auth cookie. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users go through one extra check: have they completed
  // onboarding? We need this for athletes; coaches/officers/admin/president
  // bypass.
  if (user) {
    const allowed = ONBOARDING_ALLOWED_PREFIXES.some((p) =>
      pathname.startsWith(p),
    );

    // maybeSingle so a missing profile row doesn't error out; on any DB
    // error we fall through to "no enforcement" rather than locking the
    // user out (e.g. when migration 0010 hasn't been applied yet).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle<{ role: UserRole; onboarding_completed: boolean | null }>();

    if (!profileError) {
      const role = profile?.role ?? null;
      // If the profile row is genuinely missing, treat as "needs onboarding"
      // so the user lands on /onboarding (the action there will upsert).
      const onboarded = profile?.onboarding_completed === true;

      if (!onboarded && !bypassesOnboarding(role) && !allowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/admin")) {
        // Stay in sync with the role hierarchy in lib/auth/roles.ts so
        // president (and anything we add above admin in future) is allowed.
        if (!profile || !hasRoleAtLeast(profile.role, "admin")) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          url.searchParams.set("error", "not_authorized");
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}
