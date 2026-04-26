import Link from "next/link";
import { requireMinRole } from "@/lib/auth/require-role";
import {
  ASSIGNABLE_BY_ADMIN,
  ASSIGNABLE_BY_PRESIDENT,
  isAdminOrAbove,
  isPresident,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RosterTable } from "@/components/admin/roster-table";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  const { user, profile } = await requireMinRole("officer");
  const president = isPresident(profile?.role);
  const canEditRoles = isAdminOrAbove(profile?.role);
  const assignable = president ? ASSIGNABLE_BY_PRESIDENT : ASSIGNABLE_BY_ADMIN;

  const supabase = await createClient();

  // Show everyone who has either onboarded or who bypasses onboarding
  // (coach/officer/admin/president/alumni). Non-onboarded athletes are
  // hidden because we don't have their personal info on file yet.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .or(
      "onboarding_completed.eq.true,role.in.(coach,officer,admin,president,alumni)",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .returns<Profile[]>();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <header>
        <h1 className="text-3xl font-bold">Roster information</h1>
        <p className="mt-1 text-muted-foreground">
          {canEditRoles
            ? president
              ? "Sort, search, and manage every member. Export to CSV with the button below."
              : "Sort, search, and manage non-president roles."
            : "View-only roster. Roles are managed by admins and the president."}
        </p>
      </header>

      <section className="mt-6">
        <RosterTable
          profiles={profiles ?? []}
          currentUserId={user.id}
          canEditRoles={canEditRoles}
          isPresident={president}
          assignableRoles={assignable}
        />
      </section>
    </div>
  );
}
