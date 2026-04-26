import Link from "next/link";
import { requireMinRole } from "@/lib/auth/require-role";
import { isPresident } from "@/lib/auth/roles";

export const metadata = { title: "Admin" };

type Section = {
  href: string;
  label: string;
  description: string;
  presidentOnly?: boolean;
};

const SECTIONS: Section[] = [
  {
    href: "/admin/officers",
    label: "Officers",
    description: "Add, edit, and remove executive board members.",
  },
  {
    href: "/admin/team-records",
    label: "Team Records",
    description: "Manage all-time team record times.",
  },
  {
    href: "/admin/meet-results",
    label: "Meets",
    description: "Post results from past meets.",
  },
  {
    href: "/admin/forms",
    label: "Forms",
    description: "Build sign-ups and RSVPs, view responses.",
  },
  {
    href: "/admin/users",
    label: "User Roles",
    description: "Promote, demote, and review member access.",
  },
  {
    href: "/admin/schedule",
    label: "Coaching Schedule",
    description: "Edit weekly practices and team events.",
    presidentOnly: true,
  },
];

export default async function AdminPage() {
  const { profile } = await requireMinRole("admin");
  const president = isPresident(profile?.role);

  const visible = SECTIONS.filter((s) => !s.presidentOnly || president);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as <span className="font-medium">{profile?.role}</span>. Pick
        a section to manage.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {visible.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="text-lg font-semibold group-hover:text-primary">
              {s.label} →
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.description}
            </p>
            {s.presidentOnly ? (
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                President only
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
