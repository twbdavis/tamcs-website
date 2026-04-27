import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-role";
import type { WeeklyAnnouncement } from "@/lib/content-types";

export const metadata = { title: "Weekly Announcements" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AnnouncementsPage() {
  await requireUser();

  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("weekly_announcements")
    .select("*")
    .eq("is_published", true)
    .order("received_at", { ascending: false })
    .returns<WeeklyAnnouncement[]>();

  const list = announcements ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Weekly announcements</h1>
      <p className="mt-1 text-muted-foreground">
        The latest team-wide updates from the officer board.
      </p>

      <section className="mt-8 grid gap-3">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          list.map((a, idx) => (
            <details
              key={a.id}
              open={idx === 0}
              className="group rounded-lg border border-l-4 border-l-[#500000] bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold group-hover:text-[#500000]">
                    {a.subject}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(a.received_at)}
                    {a.sender ? ` · ${a.sender}` : ""}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="text-xs text-muted-foreground transition-transform group-open:rotate-90"
                >
                  ▶
                </span>
              </summary>
              <div className="border-t px-5 py-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                  {a.body}
                </pre>
              </div>
            </details>
          ))
        )}
      </section>
    </div>
  );
}
