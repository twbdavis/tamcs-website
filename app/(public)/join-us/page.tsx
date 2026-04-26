import Link from "next/link";
import {
  Smile,
  Dumbbell,
  Users,
  Zap,
  BookOpen,
  ClipboardCheck,
  Timer,
  Mail,
  AtSign,
  GraduationCap,
  Award,
  ShieldCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Join Us",
  description:
    "How to join Texas A&M Club Swimming — membership requirements, tryouts, dues, and contact info.",
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

const REQUIREMENTS = [
  {
    Icon: GraduationCap,
    text: "A&M undergraduate and graduate students must be enrolled in at least 6 credit hours. Blinn TEAM students must be enrolled in at least 3 credit hours at Texas A&M.",
  },
  {
    Icon: GraduationCap,
    text: "Blinn TEAM and affiliated co-curricular students are eligible as long as they pay University fees.",
  },
  {
    Icon: Award,
    text: "Athletes must demonstrate proficiency through the tryout process.",
  },
  {
    Icon: ShieldCheck,
    text: "Members must be 18 or older at the time of registration due to travel liability requirements.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Attend an informational session",
    Icon: BookOpen,
  },
  {
    n: 2,
    title: "Complete the tryout set",
    Icon: ClipboardCheck,
  },
  {
    n: 3,
    title: "Make one time cut",
    Icon: Timer,
  },
];

const TRYOUT_CUTS = [
  { event: "50 Free", men: "30.09", women: "35.09" },
  { event: "100 Free", men: "1:06.49", women: "1:17.49" },
  { event: "200 Free", men: "2:28.99", women: "2:51.99" },
  { event: "50 Back", men: "35.79", women: "40.65" },
  { event: "100 Back", men: "1:16.99", women: "1:27.99" },
  { event: "50 Breast", men: "38.39", women: "46.29" },
  { event: "100 Breast", men: "1:23.99", women: "1:40.99" },
  { event: "50 Fly", men: "32.99", women: "38.29" },
  { event: "100 Fly", men: "1:13.99", women: "1:26.69" },
  { event: "100 IM", men: "1:14.99", women: "1:28.39" },
  { event: "200 IM", men: "2:49.99", women: "3:17.99" },
];

const EXPECTATIONS = [
  "Be a person.",
  "Be a teammate.",
  "Be accountable.",
  "Read the email.",
];

const POLICIES = [
  { label: "Practice", value: "6 per semester minimum" },
  { label: "Meets", value: "1 per semester minimum" },
  { label: "Volunteer", value: "1 opportunity per year" },
];

const HEADING_ACCENT =
  "inline-block border-b-4 border-[#500000] pb-1 text-3xl font-bold tracking-tight";

export default function JoinUsPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
            Tryouts at the start of every semester
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Join Texas A&amp;M Club Swimming
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            Whether you&apos;re a competitive swimmer or just getting back in
            the water, TAMCS has a place for you.
          </p>
        </div>
      </section>

      {/* ── Four F's ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={HEADING_ACCENT}>The Four F&apos;s</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Our head coach Jill Gellatly&apos;s philosophy since &apos;89.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
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
                  <div className="text-xs text-muted-foreground">{suffix}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Membership requirements ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Membership requirements</h2>
          <ul className="mt-8 grid gap-3">
            {REQUIREMENTS.map(({ Icon, text }, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                  <Icon className="size-5" />
                </span>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Tryout process ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Tryout process</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ n, title, Icon }) => (
              <div
                key={n}
                className="relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="absolute -top-3 left-6 rounded-full bg-[#500000] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  Step {n}
                </span>
                <Icon className="size-7 text-[#500000]" />
                <p className="mt-3 font-semibold">{title}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border-2 border-[#500000]/30 bg-[#500000]/5 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
              The Set
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              4 × 100 freestyle on 1:45
            </p>
            <p className="text-lg font-semibold text-foreground">
              4 × 50 IMO on 1:15
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Athletes must make at least one cut from the table below.
            </p>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold">Tryout cut times</h3>
            <div className="mt-3 overflow-hidden rounded-lg border-l-4 border-l-[#500000] border-y border-r shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#500000] hover:bg-[#500000]">
                    <TableHead className="text-white font-semibold">
                      Event
                    </TableHead>
                    <TableHead className="text-right text-white font-semibold">
                      Men&apos;s cut
                    </TableHead>
                    <TableHead className="text-right text-white font-semibold">
                      Women&apos;s cut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TRYOUT_CUTS.map((c, i) => (
                    <TableRow
                      key={c.event}
                      className={
                        (i % 2 === 0 ? "bg-background" : "bg-[#f9f9f9]") +
                        " transition-colors hover:bg-[#500000]/5"
                      }
                    >
                      <TableCell className="font-medium">{c.event}</TableCell>
                      <TableCell className="text-right font-mono">
                        {c.men}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {c.women}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expectations ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Expectations</h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXPECTATIONS.map((line) => (
              <div
                key={line}
                className="rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 text-center font-semibold shadow-sm"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {POLICIES.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border bg-card p-5 shadow-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-widest text-[#500000]">
                  {label}
                </div>
                <div className="mt-1 text-base font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dues ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className={HEADING_ACCENT}>Dues</h2>
          <div className="mt-8 inline-flex flex-col items-center rounded-2xl border-2 border-[#500000]/30 bg-card px-10 py-8 shadow-sm">
            <div className="text-4xl font-extrabold text-[#500000]">$200</div>
            <div className="text-sm text-muted-foreground">
              full year &middot; or $125 per semester
            </div>
            <div className="mt-5 grid gap-1 text-sm">
              <div>
                <span className="font-semibold">Includes:</span> team shirt,
                cap, and rally towel
              </div>
              <div className="text-muted-foreground">
                Team suit is not included with dues
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Travel requirements ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className={HEADING_ACCENT}>Travel requirements</h2>
          <ul className="mt-8 grid gap-3">
            <li className="flex items-start gap-3 rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                <GraduationCap className="size-5" />
              </span>
              <p className="text-sm leading-relaxed text-foreground/85">
                Undergraduates must maintain a{" "}
                <span className="font-semibold">2.0 GPA</span> to travel and
                compete.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                <GraduationCap className="size-5" />
              </span>
              <p className="text-sm leading-relaxed text-foreground/85">
                Graduate students must maintain a{" "}
                <span className="font-semibold">3.0 GPA</span>.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#500000]/10 text-[#500000]">
                <ShieldCheck className="size-5" />
              </span>
              <p className="text-sm leading-relaxed text-foreground/85">
                Members must be in good standing with the University and the
                Club.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section className="bg-[#500000] text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to join?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/85">
            Tryouts are held at the beginning of each semester at the TAMU
            Natatorium. Create an account on the site, then come find us at the
            pool.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-base font-semibold text-[#500000] shadow-sm transition-colors hover:bg-white/90"
            >
              Create your account
            </Link>
            <a
              href="mailto:tamuclubswim@gmail.com"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/40 bg-transparent px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Email the team
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            <a
              href="mailto:tamuclubswim@gmail.com"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <Mail className="size-4" />
              tamuclubswim@gmail.com
            </a>
            <a
              href="https://instagram.com/tamuclubswim"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <AtSign className="size-4" />
              @tamuclubswim on Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
