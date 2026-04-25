import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "About Texas A&M Club Swimming — our mission, history, and frequently asked questions.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Are there performance requirements for our team?",
    a: "Yes — you must be proficient in all four strokes.",
  },
  {
    q: "Are meets mandatory?",
    a: "Yes, one meet per semester.",
  },
  {
    q: "Are practices mandatory?",
    a: "No. We know our practice times aren't ideal for everyone, so attendance is optional.",
  },
  {
    q: "What time do practices take place, and where?",
    a: "Monday–Thursday at 7:30 PM in the Student Rec Center Natatorium.",
  },
  {
    q: "I have a question — who do I ask?",
    a: (
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <span className="font-medium">President</span> — general info, meet
          schedule, practices
        </li>
        <li>
          <span className="font-medium">Vice President</span> — USMS College
          Club Swimming, fundraising and sponsorship, home meet info
        </li>
        <li>
          <span className="font-medium">Treasurer</span> — team fees, travel
          meet fees
        </li>
        <li>
          <span className="font-medium">Secretary</span> — general info, meet
          schedule, practices
        </li>
        <li>
          <span className="font-medium">Marketing Director</span> — apparel,
          social media, website
        </li>
        <li>
          <span className="font-medium">Captain</span> — team activities,
          atmosphere, recruitment
        </li>
        <li>
          <span className="font-medium">Meet Coordinator</span> — away meet
          info, entries, results
        </li>
        <li>
          <span className="font-medium">Special Events Coordinator</span> —
          kickoff, banquet, service projects
        </li>
      </ul>
    ),
  },
  {
    q: "Have a question we didn't answer?",
    a: (
      <p>
        Email us at{" "}
        <a
          href="mailto:tamuclubswim@gmail.com?subject=TAMU%20Club%20Swim%20Inquiry"
          className="text-primary underline-offset-4 hover:underline"
        >
          tamuclubswim@gmail.com
        </a>
        .
      </p>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-4xl font-bold sm:text-5xl">About TAMCS</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Texas A&amp;M Club Swimming — student-run, nationally competitive,
          and proudly Aggie.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Mission Statement</h2>
        <p className="mt-3 text-foreground/90">
          The purpose of Texas A&amp;M University Club Swimming is to provide
          students of Texas A&amp;M University the opportunity to compete in
          championship meets at the national level.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">History</h2>
        <p className="mt-3 text-foreground/90">
          Texas A&amp;M Club Swimming was founded in 2017 by students who
          believed there needed to be a competitive collegiate swim program
          available to all students at Texas A&amp;M University. The team&apos;s
          first Executive Board was Jeppesen Feliciano, Connor Schmidt,
          Courteney Lerch, and Carrson Baldwin.
        </p>
        <p className="mt-3 text-foreground/90">
          TAMCS was the first university in the state of Texas to join{" "}
          <a
            href="https://www.collegeclubswimming.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            US Masters College Club Swimming
          </a>
          , and therefore the first Texas-based program to compete at the
          College Club National Swim Meet. The Aggies traveled to San Marcos
          for their first swim meet at Texas State in the spring of 2018.
        </p>
        <p className="mt-3 text-foreground/90">
          TAMCS was named an official sport club by the{" "}
          <a
            href="https://recsports.tamu.edu/sport-clubs/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Texas A&amp;M Sports Club Association
          </a>{" "}
          in April 2021.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <dl className="mt-6 divide-y rounded-lg border bg-card">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <dt className="font-medium">{q}</dt>
              <dd className="mt-2 text-foreground/85">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-xl bg-primary p-8 text-primary-foreground">
        <h2 className="text-2xl font-semibold">Want to swim with us?</h2>
        <p className="mt-2 text-primary-foreground/90">
          New members are always welcome — drop by a practice or check out
          tryouts.
        </p>
        <Link
          href="/join-us"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
        >
          Join the team →
        </Link>
      </section>
    </div>
  );
}
