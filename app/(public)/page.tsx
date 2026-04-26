import Link from "next/link";
import { Calendar, Info, Trophy, Users, Waves } from "lucide-react";
import { PhotoCarousel } from "@/components/photo-carousel";

const HERO_IMAGES = [
  { src: "/images/Team_Picture.jpg", alt: "TAMCS team picture" },
  { src: "/images/IMG_3641.jpeg", alt: "TAMCS team photo" },
  { src: "/images/IMG_2453%20(1).JPG", alt: "TAMCS team photo" },
  { src: "/images/IMG_2728.jpg", alt: "TAMCS team photo" },
  { src: "/images/IMG_1967.JPG", alt: "TAMCS team photo" },
  { src: "/images/IMG_5740.jpg", alt: "TAMCS at a meet" },
  { src: "/images/IMG_5765.jpg", alt: "TAMCS at a meet" },
  { src: "/images/IMG_5849.jpg", alt: "TAMCS team photo" },
];

type FeatureLink = {
  href: string;
  label: string;
  description: string;
  Icon: typeof Info;
};

const FEATURE_LINKS: FeatureLink[] = [
  {
    href: "/about",
    label: "About",
    description:
      "Our mission, history, and answers to common questions about the team.",
    Icon: Info,
  },
  {
    href: "/officers",
    label: "Officers",
    description: "Meet the student executive board running TAMCS this year.",
    Icon: Users,
  },
  {
    href: "/schedule",
    label: "Schedule",
    description: "Upcoming practices, meets, and team events.",
    Icon: Calendar,
  },
  {
    href: "/team-records",
    label: "Team Records",
    description: "All-time fastest times in TAMCS history.",
    Icon: Waves,
  },
  {
    href: "/meet-results",
    label: "Meets",
    description: "How the Aggies have been racing in recent meets.",
    Icon: Trophy,
  },
];

const SOCIALS: {
  href: string;
  label: string;
  handle: string;
  icon: React.ReactNode;
}[] = [
  {
    href: "https://instagram.com/tamuclubswim",
    label: "Instagram",
    handle: "@tamuclubswim",
    icon: <InstagramIcon className="size-6" />,
  },
  {
    href: "https://facebook.com/tamuclubswim",
    label: "Facebook",
    handle: "tamuclubswim",
    icon: <FacebookIcon className="size-6" />,
  },
  {
    href: "https://twitter.com/tamuclubswim",
    label: "Twitter",
    handle: "@tamuclubswim",
    icon: <TwitterIcon className="size-6" />,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative isolate h-[70vh] min-h-[460px] w-full overflow-hidden bg-primary text-primary-foreground">
        <PhotoCarousel images={HERO_IMAGES} alt="Texas A&M Club Swimming" />

        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Texas A&amp;M University
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl">
              Texas A&amp;M Club Swimming
            </h1>
            <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
              <Link
                href="/join-us"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-base font-semibold text-[#500000] shadow-sm transition-colors hover:bg-white/90"
              >
                Join the team
              </Link>
              <Link
                href="/schedule"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#500000] px-6 text-base font-semibold text-white shadow-sm ring-1 ring-white/20 transition-colors hover:bg-[#3d0000]"
              >
                See the schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          HOWDY!
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-foreground/85">
          Welcome to Texas A&amp;M Club Swimming! TAMCS is a unique program
          that combines competition and fun while focusing on becoming
          stronger athletes in and out of the pool. With travel meets,
          socials and practices, our team is the perfect place for students
          to continue their swimming career throughout college!
        </p>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">
            <span className="border-b-4 border-[#500000] pb-1">
              Explore the team
            </span>
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_LINKS.map(({ href, label, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 rounded-xl border-2 border-transparent bg-card p-5 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:border-[#500000] hover:shadow-lg hover:ring-[#500000]/20"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#500000]/10 text-[#500000] transition-colors group-hover:bg-[#500000] group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold transition-colors group-hover:text-[#500000]">
                    {label} →
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Follow us</h2>
          <p className="mt-2 text-primary-foreground/80">
            Catch team updates, meet recaps, and behind-the-scenes content.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
                aria-label={`${s.label} (${s.handle})`}
              >
                <span className="text-white">{s.icon}</span>
                <span className="flex flex-col items-start text-left leading-tight">
                  <span className="text-xs uppercase tracking-wider text-white/70">
                    {s.label}
                  </span>
                  <span>{s.handle}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2-3 0-6-2-6-5 1 .5 2.5.5 3.5.5C2 11 1 8 2 6c2 3 5 5 9 5-.5-2 1-4 3-4.5C15.4 6.4 17 7 18 8c1.4-.3 2.6-.7 4-1.5 0 0-.5 1.5-2 2.5z" />
    </svg>
  );
}
