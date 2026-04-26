import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import type { Meet, MeetAttachment } from "@/lib/content-types";

export const metadata = { title: "Upcoming Meets" };

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  if (!y || !m || !d) return yyyymmdd;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function AthleteMeetsPage() {
  await requireUser();

  const supabase = await createClient();
  const { data: meets } = await supabase
    .from("meets")
    .select("*")
    .eq("is_published", true)
    .order("meet_date", { ascending: true })
    .returns<Meet[]>();

  const today = todayKey();
  const upcoming = (meets ?? []).filter((m) => m.meet_date >= today);
  const past = (meets ?? [])
    .filter((m) => m.meet_date < today)
    .sort((a, b) => b.meet_date.localeCompare(a.meet_date));

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
      <h1 className="text-3xl font-bold">Meets</h1>
      <p className="mt-1 text-muted-foreground">
        Upcoming meets. Click a card for travel, signup, and attachment
        details.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming meets posted yet.
          </p>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((m) => (
              <MeetCard key={m.id} meet={m} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Completed</h2>
          <div className="grid gap-3">
            {past.map((m) => (
              <MeetCard key={m.id} meet={m} completed />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MeetCard({
  meet,
  completed = false,
}: {
  meet: Meet;
  completed?: boolean;
}) {
  const deadlinePassed =
    meet.signup_deadline !== null &&
    new Date(meet.signup_deadline).getTime() < Date.now();

  return (
    <details className="group rounded-lg border bg-card">
      <summary
        className={
          "flex cursor-pointer items-start justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden"
        }
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{meet.title}</h3>
            {completed ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Completed
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDate(meet.meet_date)} · {meet.location}
          </p>
          {meet.description ? (
            <p className="mt-2 text-sm text-foreground/85">{meet.description}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className="text-xs text-muted-foreground transition-transform group-open:rotate-90"
        >
          ▶
        </span>
      </summary>

      <div className="grid gap-4 border-t px-5 py-4 text-sm">
        {(meet.warmup_time || meet.event_start_time) ? (
          <Detail label="Schedule">
            {meet.warmup_time ? <div>Warmup: {meet.warmup_time}</div> : null}
            {meet.event_start_time ? (
              <div>Events start: {meet.event_start_time}</div>
            ) : null}
          </Detail>
        ) : null}

        {meet.travel_info ? (
          <Detail label="Travel">
            <p className="whitespace-pre-wrap">{meet.travel_info}</p>
          </Detail>
        ) : null}

        {meet.signup_url ? (
          <Detail label="Signup">
            {completed || deadlinePassed ? (
              <span className="inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground">
                Signup closed
              </span>
            ) : (
              <a
                href={meet.signup_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm" })}
              >
                Sign up ↗
              </a>
            )}
            {meet.signup_deadline && !completed ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Deadline:{" "}
                {new Date(meet.signup_deadline).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </Detail>
        ) : null}

        {meet.attachments_urls.length > 0 ? (
          <Detail label="Attachments">
            <ul className="grid gap-1">
              {meet.attachments_urls.map((a: MeetAttachment) => (
                <li key={`${a.name}-${a.url}`}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {a.name} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Detail>
        ) : null}
      </div>
    </details>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
