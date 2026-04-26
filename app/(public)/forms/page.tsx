import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import type { Form } from "@/lib/content-types";

export const metadata = { title: "Forms" };

export default async function PublicFormsPage() {
  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .returns<Form[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Forms</h1>
        <p className="mt-2 text-muted-foreground">
          Sign-ups, RSVPs, and feedback. You&apos;ll need to be signed in to
          submit.
        </p>
      </header>

      {!forms || forms.length === 0 ? (
        <p className="text-muted-foreground">
          No forms are open right now. Check back later!
        </p>
      ) : (
        <ul className="grid gap-4">
          {forms.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{f.title}</h2>
                  {f.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/forms/${f.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
