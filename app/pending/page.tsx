import { redirect } from "next/navigation";
import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { getUserAndProfile } from "@/lib/auth/require-role";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata = { title: "Pending Approval" };

export default async function PendingApprovalPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?redirectTo=/pending");
  // If they've already been approved (or never needed approval), bounce
  // them back into the dashboard rather than dead-ending here.
  if (profile?.account_approved) redirect("/dashboard");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <>
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              Welcome to TAMCS!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your registration is being reviewed by our officers. You&apos;ll
              get full access once approved.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              An officer will review your registration shortly.
            </p>
            <div className="mt-8 flex justify-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
