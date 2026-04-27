import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { SettingsForm } from "@/components/auth/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-muted-foreground">
        Update your contact info and social handles. Officers can see these
        on the team roster — leave a field blank to keep it private.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <SettingsForm
          defaults={{
            phone_number: profile?.phone_number ?? null,
            instagram_handle: profile?.instagram_handle ?? null,
            snapchat_handle: profile?.snapchat_handle ?? null,
            linkedin_handle: profile?.linkedin_handle ?? null,
            show_phone: profile?.show_phone ?? false,
            show_instagram: profile?.show_instagram ?? false,
            show_snapchat: profile?.show_snapchat ?? false,
            show_linkedin: profile?.show_linkedin ?? false,
          }}
        />
      </section>
    </div>
  );
}
