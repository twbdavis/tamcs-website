import { redirect } from "next/navigation";
import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getUserAndProfile } from "@/lib/auth/require-role";
import { hasRoleAtLeast } from "@/lib/auth/roles";

export const metadata = { title: "Welcome" };

// Roles that bypass onboarding (mirrors middleware logic).
function bypassesOnboarding(role: string | null | undefined): boolean {
  if (!role) return false;
  if (role === "coach" || role === "alumni") return true;
  return hasRoleAtLeast(
    role as Parameters<typeof hasRoleAtLeast>[0],
    "officer",
  );
}

export default async function OnboardingPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?redirectTo=/onboarding");
  if (profile?.onboarding_completed || bypassesOnboarding(profile?.role)) {
    redirect("/dashboard");
  }

  // Best-effort prefill from full_name "First Last".
  const parts = (profile?.full_name ?? "").trim().split(/\s+/);
  const defaults = {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };

  return (
    <>
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold">Welcome to TAMCS</h1>
            <p className="mt-2 text-muted-foreground">
              A few quick details before you can hop in. We need this on file
              for every athlete on the team.
            </p>
          </header>
          <section className="rounded-lg border bg-card p-6">
            <OnboardingForm defaults={defaults} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
