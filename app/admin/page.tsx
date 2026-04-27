import Link from "next/link";
import {
  CalendarDays,
  FileEdit,
  Medal,
  ScrollText,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { requireMinRole } from "@/lib/auth/require-role";
import { isPresident } from "@/lib/auth/roles";

export const metadata = { title: "Admin" };

type Section = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  presidentOnly?: boolean;
};

const SECTIONS: Section[] = [
  {
    href: "/admin/officers",
    label: "Officers",
    description: "Add, edit, and remove executive board members.",
    Icon: Users,
  },
  {
    href: "/admin/team-records",
    label: "Team Records",
    description: "Manage all-time team record times.",
    Icon: Medal,
  },
  {
    href: "/admin/meet-results",
    label: "Meets",
    description: "Post results from past meets.",
    Icon: ScrollText,
  },
  {
    href: "/admin/forms",
    label: "Forms",
    description: "Build sign-ups and RSVPs, view responses.",
    Icon: FileEdit,
  },
  {
    href: "/admin/users",
    label: "User Roles",
    description: "Promote, demote, and review member access.",
    Icon: UserCog,
  },
  {
    href: "/admin/schedule",
    label: "Coaching Schedule",
    description: "Edit weekly practices and team events.",
    Icon: CalendarDays,
    presidentOnly: true,
  },
];

const CARD_CLASS =
  "group flex items-start gap-4 rounded-lg border border-l-4 border-l-[#500000] bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#500000]";

const ICON_TILE_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000] transition-colors group-hover:bg-[#500000] group-hover:text-white";

export default async function AdminPage() {
  const { profile } = await requireMinRole("admin");
  const president = isPresident(profile?.role);

  const visible = SECTIONS.filter((s) => !s.presidentOnly || president);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as <span className="font-medium">{profile?.role}</span>. Pick
        a section to manage.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {visible.map(({ href, label, description, Icon, presidentOnly }) => (
          <Link key={href} href={href} className={CARD_CLASS}>
            <span className={ICON_TILE_CLASS}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold group-hover:text-[#500000]">
                {label} →
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
              {presidentOnly ? (
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                  President only
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
