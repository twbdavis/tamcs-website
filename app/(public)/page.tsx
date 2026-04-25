import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PhotoCarousel } from "@/components/photo-carousel";

const HERO_IMAGES = [
  { src: "/images/Team_Picture.jpg", alt: "TAMCS team picture" },
  { src: "/images/IMG_1967.JPG", alt: "TAMCS team photo" },
  { src: "/images/IMG_2111.JPG", alt: "TAMCS team photo" },
  { src: "/images/IMG_2179.jpg", alt: "TAMCS team photo" },
  { src: "/images/IMG_2728.jpg", alt: "TAMCS team photo" },
  { src: "/images/IMG_5740.jpg", alt: "TAMCS at a meet" },
  { src: "/images/IMG_5762.jpg", alt: "TAMCS at a meet" },
  { src: "/images/IMG_5765.jpg", alt: "TAMCS at a meet" },
  { src: "/images/IMG_5849.jpg", alt: "TAMCS team photo" },
  { src: "/images/IMG_8469.JPG", alt: "TAMCS team event" },
];

const FEATURE_LINKS: { href: string; label: string; description: string }[] = [
  {
    href: "/about",
    label: "About",
    description:
      "Our mission, history, and answers to common questions about the team.",
  },
  {
    href: "/officers",
    label: "Officers",
    description: "Meet the student executive board running TAMCS this year.",
  },
  {
    href: "/schedule",
    label: "Schedule",
    description: "Upcoming practices, meets, and team events.",
  },
  {
    href: "/team-records",
    label: "Team Records",
    description: "All-time fastest times in TAMCS history.",
  },
  {
    href: "/meet-results",
    label: "Meet Results",
    description: "How the Aggies have been racing in recent meets.",
  },
  {
    href: "/blog",
    label: "Blog",
    description: "News and write-ups from the team.",
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
        <PhotoCarousel images={HERO_IMAGES} alt="Texas A&M Club Swim" />

        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Texas A&amp;M University
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl">
              Texas A&amp;M Club Swim
            </h1>
            <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
              <Link
                href="/join-us"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Join the team
              </Link>
              <Link
                href="/schedule"
                className={
                  buttonVariants({ variant: "outline", size: "lg" }) +
                  " border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
                }
              >
                See the schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
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
          <h2 className="text-2xl font-bold">Explore the team</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold group-hover:text-primary">
                  {l.label} →
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {l.description}
                </p>
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
