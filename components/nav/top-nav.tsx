import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/nav/user-menu";
import { MobileMenu } from "@/components/nav/mobile-menu";
import {
  publicLinks,
  visitorLinks,
  memberLinks,
} from "@/components/nav/top-nav-links";

export async function TopNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <span className="text-lg font-bold tracking-tight">
            Texas A&amp;M Club Swimming
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ...publicLinks,
            ...(user ? memberLinks : visitorLinks),
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu email={user.email ?? ""} />
          ) : (
            <Link
              href="/login"
              className="hidden h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-[#500000] shadow-sm transition-colors hover:bg-white/90 sm:inline-flex"
            >
              Log in
            </Link>
          )}
          <MobileMenu signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
