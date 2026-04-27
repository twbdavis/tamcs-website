import Link from "next/link";
import { Calendar, Clock, MapPin, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-role";
import type { Social } from "@/lib/content-types";

export const metadata = { title: "Socials" };

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(t: string | null): string | null {
  if (!t) return null;
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function SocialsPage() {
  await requireUser();

  const supabase = await createClient();
  const { data: socials } = await supabase
    .from("socials")
    .select("*")
    .eq("is_published", true)
    .order("event_date", { ascending: true })
    .returns<Social[]>();

  const today = todayKey();
  const upcoming = (socials ?? []).filter((s) => s.event_date >= today);
  const past = (socials ?? [])
    .filter((s) => s.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

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
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <PartyPopper className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold">Team socials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hangouts, mixers, and the not-swimming side of TAMCS.
          </p>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing on the calendar yet — officers, plan something fun.
          </p>
        ) : (
          <div className="grid gap-4">
            {upcoming.map((s) => (
              <SocialCard key={s.id} social={s} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Past</h2>
          <div className="grid gap-3">
            {past.map((s) => (
              <SocialCard key={s.id} social={s} past />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SocialCard({
  social: s,
  past = false,
}: {
  social: Social;
  past?: boolean;
}) {
  const time = formatTime(s.event_time);
  return (
    <article
      className={
        "overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md " +
        (past ? "opacity-70" : "border-l-4 border-l-emerald-500")
      }
    >
      <div className="grid gap-3 p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-xl font-semibold">{s.title}</h3>
          {past ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Past
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
              Social
            </span>
          )}
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-emerald-600" aria-hidden />
            <span>{formatDate(s.event_date)}</span>
          </div>
          {time ? (
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-emerald-600" aria-hidden />
              <span>{time}</span>
            </div>
          ) : null}
          {s.location ? (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-emerald-600" aria-hidden />
              <span>{s.location}</span>
            </div>
          ) : null}
        </dl>
        {s.description ? (
          <p className="text-sm text-foreground/85 whitespace-pre-wrap">
            {s.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
