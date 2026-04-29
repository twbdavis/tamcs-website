import Link from "next/link";
import {
  Smile,
  Dumbbell,
  Users,
  Zap,
  Calendar,
  Sparkles,
  Trophy,
  Medal,
  MapPin,
  Heart,
  Plane,
  PartyPopper,
  Mail,
  AtSign,
  ArrowRight,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export const metadata = {
  title: "About",
  description:
    "About Texas A&M Club Swimming",
};

type FourF = {
  label: string;
  suffix?: string;
  Icon: typeof Smile;
};

const FOUR_FS: FourF[] = [
  { label: "Have Fun", Icon: Smile },
  { label: "Gain Fitness", Icon: Dumbbell },
  { label: "Make Friends", Icon: Users },
  { label: "Swim Fast", suffix: "(optional!)", Icon: Zap },
];

const SWL_OPPONENTS = [
  "UT",
  "UTSA",
  "UTD",
  "TTU",
  "Baylor",
  "TXST",
  "OU",
  "OSU",
  "TCU",
  "UNT",
  "Harding",
  "Rice",
];

const NATIONALS_RESULTS = [
  { label: "Women", place: "29th" },
  { label: "Men", place: "19th" },
];

const SWL_RESULTS = [
  { label: "Women", place: "1st" },
  { label: "Men", place: "1st" },
];

const ACTIVITIES = [
  {
    Icon: Calendar,
    title: "Practices",
    body: "Monday–Thursday, 7:30–9:00 PM at the TAMU Natatorium.",
  },
  {
    Icon: Plane,
    title: "Travel meets",
    body: "Travel meets throughout the year against schools across the region.",
  },
  {
    Icon: PartyPopper,
    title: "Weekly socials",
    body: "Kickball, sand volleyball, ultimate frisbee, A&M sporting events, and tailgates.",
  },
  {
    Icon: Heart,
    title: "Monthly fundraisers",
    body: "Profit shares, bake sales, and other team-run fundraising events.",
  },
  {
    Icon: Trophy,
    title: "End-of-season Championship meets",
    body: "We close out every year attending nationals and hosting the Southwest Swim League championship meet.",
  },
];

const HEADING_ACCENT =
  "inline-block border-b-4 border-[#500000] pb-1 text-3xl font-bold tracking-tight";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
            Established 2017 · Sport Club since 2021
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            About TAMCS
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            Texas A&amp;M Club Swimming: where competition meets community
            since 2017.
          </p>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Our story</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="relative rounded-xl border bg-card p-6 shadow-sm">
              <span className="absolute -top-3 left-6 rounded-full bg-[#500000] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                December 2017
              </span>
              <Calendar className="size-7 text-[#500000]" />
              <p className="mt-3 font-semibold">Established</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                Founded by students who believed Texas A&amp;M needed a
                competitive collegiate swim program open to all Aggies.
              </p>
            </div>
            <div className="relative rounded-xl border bg-card p-6 shadow-sm">
              <span className="absolute -top-3 left-6 rounded-full bg-[#500000] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                May 2021
              </span>
              <Sparkles className="size-7 text-[#500000]" />
              <p className="mt-3 font-semibold">Official Sport Club</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                Recognized as an official member of the Texas A&amp;M Sport
                Clubs Association.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border-2 border-[#500000]/30 bg-[#500000]/5 p-6 text-center">
            <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">
              TAMCS is a unique community that blends{" "}
              <span className="font-semibold text-[#500000]">competition</span>,{" "}
              <span className="font-semibold text-[#500000]">fitness</span>,{" "}
              <span className="font-semibold text-[#500000]">friendship</span>,
              and <span className="font-semibold text-[#500000]">fun</span> -
              entirely student-run.
            </p>
          </div>
        </div>
      </section>

      {/* ── Our Coach ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Our coach</h2>

          <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
                  Head Coach
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  Jill Gellatly
                </p>
                <p className="text-sm text-muted-foreground">
                  Texas A&amp;M Class of &apos;89
                </p>
              </div>
              <div className="rounded-md bg-[#500000]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#500000]">
                The 4 F&apos;s philosophy
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {FOUR_FS.map(({ label, suffix, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex size-24 items-center justify-center rounded-full bg-[#500000] text-white shadow-md ring-4 ring-[#500000]/10 transition-transform hover:-translate-y-1">
                    <Icon className="size-10" />
                  </div>
                  <div className="mt-4 text-lg font-semibold">{label}</div>
                  {suffix ? (
                    <div className="text-xs text-muted-foreground">
                      {suffix}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Competitive Results ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Where we compete</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-l-4 border-l-[#500000] bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                  <Trophy className="size-5" />
                </span>
                <p className="font-semibold">USMS College Club Swimming</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                Part of a national league with{" "}
                <span className="font-semibold">210+ teams</span> and{" "}
                <span className="font-semibold">1,500+ swimmers</span>{" "}
                competing at Nationals each year.
              </p>
            </div>

            <div className="rounded-xl border border-l-4 border-l-[#500000] bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                  <MapPin className="size-5" />
                </span>
                <p className="font-semibold">Southwest Swim League</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                We compete head-to-head with rival programs across the region:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SWL_OPPONENTS.map((school) => (
                  <span
                    key={school}
                    className="rounded-md bg-[#500000]/10 px-2 py-0.5 text-xs font-semibold text-[#500000]"
                  >
                    {school}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <h3 className="mt-12 text-lg font-semibold">2026 results</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border-2 border-[#500000]/30 bg-card shadow-sm">
              <div className="bg-[#500000] px-6 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Medal className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-widest">
                    College Club Nationals
                  </p>
                </div>
                <p className="text-sm text-white/85">
                  Out of ~200 teams nationally
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#500000]/20">
                {NATIONALS_RESULTS.map(({ label, place }) => (
                  <div key={label} className="p-6 text-center">
                    <div className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
                      {label}
                    </div>
                    <div className="mt-2 text-4xl font-extrabold text-[#500000]">
                      {place}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-[#500000]/30 bg-card shadow-sm">
              <div className="bg-[#500000] px-6 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-widest">
                    Southwest Swim League Champs
                  </p>
                </div>
                <p className="text-sm text-white/85">
                  Conference champions, both teams
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#500000]/20">
                {SWL_RESULTS.map(({ label, place }) => (
                  <div key={label} className="p-6 text-center">
                    <div className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
                      {label}
                    </div>
                    <div className="mt-2 text-4xl font-extrabold text-[#500000]">
                      {place}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What We Do ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>What we do</h2>

          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {ACTIVITIES.map(({ Icon, title, body }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-lg border border-l-4 border-l-[#500000] bg-card p-5 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section className="bg-[#500000] text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get in touch
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/85">
            Questions about the team, prospective members, or just want to say
            howdy? We&apos;d love to hear from you.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/join-us"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-base font-semibold text-[#500000] shadow-sm transition-colors hover:bg-white/90"
            >
              Join the team
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <a
              href="mailto:tamuclubswim@gmail.com"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/40 bg-transparent px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Mail className="mr-2 size-4" />
              Email the team
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <a
              href="mailto:tamuclubswim@gmail.com"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <AtSign className="size-4" />
              tamuclubswim@gmail.com
            </a>
            <a
              href="https://instagram.com/tamuclubswim"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <InstagramIcon className="size-4" />
              @tamuclubswim
            </a>
            <a
              href="https://facebook.com/tamuclubswim"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <FacebookIcon className="size-4" />
              tamuclubswim
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
