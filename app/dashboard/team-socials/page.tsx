import Link from "next/link";
import { AtSign, Briefcase, Ghost, Phone, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-role";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Team Socials" };

type DirectoryRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  class_year: string | null;
  phone_number: string | null;
  instagram_handle: string | null;
  snapchat_handle: string | null;
  linkedin_handle: string | null;
};

function instagramUrl(handle: string): string {
  const clean = handle.trim().replace(/^@+/, "");
  return `https://instagram.com/${encodeURIComponent(clean)}`;
}

function snapchatUrl(handle: string): string {
  const clean = handle.trim().replace(/^@+/, "");
  return `https://www.snapchat.com/add/${encodeURIComponent(clean)}`;
}

function linkedinUrl(handle: string): string {
  const trimmed = handle.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const clean = trimmed.replace(/^\/+/, "");
  return `https://www.linkedin.com/in/${encodeURIComponent(clean)}`;
}

function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `tel:${digits}` : `tel:${phone}`;
}

export default async function TeamSocialsPage() {
  await requireUser();

  const supabase = await createClient();
  const { data } = await supabase.rpc("team_socials_directory");
  const rows = ((data as DirectoryRow[] | null) ?? []).filter(
    (r) =>
      r.phone_number ||
      r.instagram_handle ||
      r.snapchat_handle ||
      r.linkedin_handle,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#500000]/10 text-[#500000]">
          <Users className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold">Team socials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Teammates who&apos;ve opted into sharing their info. Update your
            own visibility from{" "}
            <Link
              href="/dashboard/settings"
              className="text-[#500000] underline-offset-2 hover:underline"
            >
              Settings
            </Link>
            .
          </p>
        </div>
      </header>

      <section className="mt-8">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No one has opted in yet — be the first.
            </p>
            <Link
              href="/dashboard/settings"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-4"}
            >
              Update my settings →
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => {
              const name = [r.first_name, r.last_name]
                .filter(Boolean)
                .join(" ")
                .trim();
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-l-4 border-l-[#500000] bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h2 className="text-lg font-semibold">{name || "—"}</h2>
                    {r.class_year ? (
                      <span className="text-xs text-muted-foreground">
                        {r.class_year}
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-2 grid gap-1 text-sm">
                    {r.instagram_handle ? (
                      <li className="flex items-center gap-2">
                        <AtSign
                          className="size-4 text-[#500000]"
                          aria-hidden
                        />
                        <a
                          href={instagramUrl(r.instagram_handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#500000] underline-offset-2 hover:underline"
                        >
                          @
                          {r.instagram_handle.replace(/^@+/, "")}
                        </a>
                      </li>
                    ) : null}
                    {r.snapchat_handle ? (
                      <li className="flex items-center gap-2">
                        <Ghost
                          className="size-4 text-[#500000]"
                          aria-hidden
                        />
                        <a
                          href={snapchatUrl(r.snapchat_handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#500000] underline-offset-2 hover:underline"
                        >
                          {r.snapchat_handle.replace(/^@+/, "")}
                        </a>
                      </li>
                    ) : null}
                    {r.linkedin_handle ? (
                      <li className="flex items-center gap-2">
                        <Briefcase
                          className="size-4 text-[#500000]"
                          aria-hidden
                        />
                        <a
                          href={linkedinUrl(r.linkedin_handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#500000] underline-offset-2 hover:underline"
                        >
                          LinkedIn
                        </a>
                      </li>
                    ) : null}
                    {r.phone_number ? (
                      <li className="flex items-center gap-2">
                        <Phone
                          className="size-4 text-[#500000]"
                          aria-hidden
                        />
                        <a
                          href={telHref(r.phone_number)}
                          className="text-[#500000] underline-offset-2 hover:underline"
                        >
                          {r.phone_number}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
