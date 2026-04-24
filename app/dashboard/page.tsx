import { requireUser } from "@/lib/auth/require-role";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, profile } = await requireUser();

  const name = profile?.full_name ?? user.email ?? "swimmer";
  const role = profile?.role ?? "guest";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Welcome, {name}.</h1>
      <p className="mt-2 text-muted-foreground">
        Your role: <span className="font-medium text-foreground">{role}</span>
      </p>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
