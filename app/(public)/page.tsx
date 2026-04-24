import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Texas A&amp;M Club Swim
          </h1>
          <p className="max-w-2xl text-lg text-primary-foreground/85">
            A student-run competitive swimming club at Texas A&amp;M University.
            Train hard, race fast, and represent the 12th Man in the water.
          </p>
          <div className="flex gap-3">
            <Link
              href="/join-us"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Join the team
            </Link>
            <Link
              href="/schedule"
              className={buttonVariants({ variant: "outline", size: "lg" }) + " border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"}
            >
              This season&apos;s schedule
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-semibold">Competitive</h2>
            <p className="mt-2 text-muted-foreground">
              We compete at regional and national club-level meets against
              other universities throughout the year.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Inclusive</h2>
            <p className="mt-2 text-muted-foreground">
              Open to swimmers of all backgrounds — from former varsity
              athletes to people just getting back in the pool.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Student-run</h2>
            <p className="mt-2 text-muted-foreground">
              Officers set the season, organize travel, and keep the team
              running. Join us or run for an officer spot.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
