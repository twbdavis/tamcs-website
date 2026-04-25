import { createClient } from "@/lib/supabase/server";
import type { Officer } from "@/lib/content-types";

export const metadata = { title: "Officers" };

export default async function OfficersPage() {
  const supabase = await createClient();
  const { data: officers } = await supabase
    .from("officers")
    .select("*")
    .order("display_order")
    .order("name")
    .returns<Officer[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Meet our Executive Board</h1>
        <p className="mt-3 text-muted-foreground">
          The student leaders running TAMCS this year.
        </p>
      </header>

      {!officers || officers.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Officers will be posted here soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <article
              key={o.id}
              className="flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              <div className="flex justify-center bg-card p-5 pb-0">
                <div className="relative aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-xl border bg-muted shadow-sm">
                  {o.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.photo_url}
                      alt={o.name}
                      className="absolute inset-0 size-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-bold text-primary/30">
                      {initials(o.name)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-xl font-semibold">{o.name}</h2>
                <p className="text-sm font-medium text-primary">{o.role}</p>
                {o.year ? (
                  <p className="text-xs text-muted-foreground">{o.year}</p>
                ) : null}
                {o.bio ? (
                  <p className="mt-3 text-sm text-foreground/85">{o.bio}</p>
                ) : null}
                {o.email ? (
                  <a
                    href={`mailto:${o.email}`}
                    className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {o.email}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
