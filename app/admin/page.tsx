import Link from "next/link";

export const metadata = { title: "Admin" };

const SECTIONS: { href: string; label: string; description: string }[] = [
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
    href: "/admin/schedule",
    label: "Schedule",
    description: "Practices, meets, socials.",
  },
  {
    href: "/admin/meet-results",
    label: "Meet Results",
    description: "Post results from past meets.",
  },
  {
    href: "/admin/blog",
    label: "Blog",
    description: "Write and publish team announcements.",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Officer-only management areas. Pick a section to manage.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
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
          </Link>
        ))}
      </div>
    </div>
  );
}
