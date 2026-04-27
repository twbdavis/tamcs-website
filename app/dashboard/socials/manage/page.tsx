import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { SocialForm } from "@/components/admin/social-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  deleteSocialAction,
  toggleSocialPublishedAction,
} from "@/app/actions/socials";
import type { Social } from "@/lib/content-types";

export const metadata = { title: "Plan a Social" };

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(t: string | null): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function ManageSocialsPage() {
  await requireMinRole("officer");

  const supabase = await createClient();
  const { data: socials } = await supabase
    .from("socials")
    .select("*")
    .order("event_date", { ascending: false })
    .returns<Social[]>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Plan a social</h1>
      <p className="mt-1 text-muted-foreground">
        Create new team socials and manage existing ones. Published socials
        show up on the athlete dashboard and the public schedule.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Create social</h2>
        <SocialForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All socials</h2>
        {!socials || socials.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No socials yet.
          </p>
        ) : (
          <ul className="grid gap-3">
            {socials.map((s) => (
              <li
                key={s.id}
                className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                      Social
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDate(s.event_date)}
                    {s.event_time ? ` · ${formatTime(s.event_time)}` : ""}
                    {s.location ? ` · ${s.location}` : ""}
                  </p>
                  {s.description ? (
                    <p className="mt-2 text-sm">{s.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <form action={toggleSocialPublishedAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="next"
                      value={String(!s.is_published)}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant={s.is_published ? "default" : "outline"}
                    >
                      {s.is_published ? "Published" : "Draft"}
                    </Button>
                  </form>
                  <Link
                    href={`/dashboard/socials/${s.id}/edit`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteSocialAction}
                    id={s.id}
                    confirmMessage={`Delete "${s.title}"?`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
