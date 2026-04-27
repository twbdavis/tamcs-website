import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth/require-role";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "CCS Resources" };

export default async function CcsResourcesPage() {
  await requireUser();

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

      <header>
        <h1 className="text-3xl font-bold">
          College Club Swimming (CCS) Resources
        </h1>
        <p className="mt-2 text-muted-foreground">
          TAMCS is a member of College Club Swimming (CCS), the national
          governing body for collegiate club swimming. All athletes are
          required to create a CCS account and register with our team.
        </p>
      </header>

      <section className="mt-8 rounded-lg border border-l-4 border-l-[#500000] bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Registration Instructions</h2>
        <ol className="mt-4 grid gap-3 text-sm">
          <Step n={1}>
            Go to{" "}
            <a
              href="https://collegeclubswimming.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#500000] underline-offset-2 hover:underline"
            >
              collegeclubswimming.com
            </a>{" "}
            and create an account.
          </Step>
          <Step n={2}>
            Once your account is created, go to the team registration page
            (link below) and sign up for Texas A&amp;M Club Swimming.
          </Step>
        </ol>
        <p className="mt-5 rounded-md border-l-2 border-l-amber-500 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30">
          <span className="font-semibold">Note:</span> You must complete CCS
          registration before you can compete in any meets.
        </p>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <a
          href="https://collegeclubswimming.com"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" }) +
            " justify-between"}
        >
          <span>CCS Website</span>
          <ExternalLink className="size-4" />
        </a>
        <a
          href="https://www.clubassistant.com/club/rosters.cfm?ccs=1554178"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg" }) + " justify-between"}
        >
          <span>Register for TAMCS on CCS</span>
          <ExternalLink className="size-4" />
        </a>
      </section>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#500000] text-xs font-semibold text-white">
        {n}
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  );
}
