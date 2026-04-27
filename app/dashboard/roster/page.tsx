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
import { PendingRosterList } from "@/components/admin/pending-roster-list";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Roster" };

type Tab = "active" | "pending";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user, profile } = await requireMinRole("officer");
  const president = isPresident(profile?.role);
  const canEditRoles = isAdminOrAbove(profile?.role);
  const assignable = president ? ASSIGNABLE_BY_PRESIDENT : ASSIGNABLE_BY_ADMIN;

  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "pending" ? "pending" : "active";

  const supabase = await createClient();

  // Active roster: onboarded + approved, plus role-bypassed members.
  // Pending: athletes who finished onboarding but haven't been approved.
  // Roster is intentionally @tamu.edu only — non-tamu test/seed accounts
  // and any one-off allowlisted signups are filtered out here.
  const [activeQuery, pendingQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .or(
        "and(onboarding_completed.eq.true,account_approved.eq.true),role.in.(coach,officer,admin,president,alumni)",
      )
      .ilike("email", "%@tamu.edu")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .returns<Profile[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("onboarding_completed", true)
      .eq("account_approved", false)
      .ilike("email", "%@tamu.edu")
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
  ]);

  const activeProfiles = activeQuery.data ?? [];
  const pendingProfiles = pendingQuery.data ?? [];

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

      <nav className="mt-6 flex flex-wrap gap-2">
        <TabLink href="/dashboard/roster?tab=active" active={tab === "active"}>
          Active Roster
        </TabLink>
        <TabLink
          href="/dashboard/roster?tab=pending"
          active={tab === "pending"}
        >
          <span className="flex items-center gap-2">
            Pending Approval
            {pendingProfiles.length > 0 ? (
              <span
                className={
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold " +
                  (tab === "pending"
                    ? "bg-white text-[#500000]"
                    : "bg-amber-500 text-white")
                }
              >
                {pendingProfiles.length}
              </span>
            ) : null}
          </span>
        </TabLink>
      </nav>

      <section className="mt-6">
        {tab === "pending" ? (
          <PendingRosterList profiles={pendingProfiles} />
        ) : (
          <RosterTable
            profiles={activeProfiles}
            currentUserId={user.id}
            canEditRoles={canEditRoles}
            isPresident={president}
            assignableRoles={assignable}
          />
        )}
      </section>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-sm " +
        (active
          ? "border-[#500000] bg-[#500000] text-white"
          : "hover:bg-muted")
      }
    >
      {children}
    </Link>
  );
}
