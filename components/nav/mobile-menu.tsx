"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  publicLinks,
  visitorLinks,
  memberLinks,
} from "@/components/nav/top-nav-links";

export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-md text-primary-foreground hover:bg-white/10 lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-white/10 bg-primary text-primary-foreground shadow-md lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {[
              ...publicLinks,
              ...(signedIn ? memberLinks : visitorLinks),
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
            {!signedIn && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
