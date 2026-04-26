import Link from "next/link";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <div className="flex flex-col items-center lg:items-start">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-[#500000]"
          >
            Texas A&amp;M Club Swimming
          </Link>
          <span className="mt-1 text-xs text-muted-foreground">
            &copy; {year} Texas A&amp;M Club Swimming. All rights reserved.
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="https://instagram.com/tamuclubswim"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-[#500000]"
          >
            <InstagramIcon className="size-5" />
          </Link>
          <Link
            href="https://facebook.com/tamuclubswim"
            aria-label="Facebook"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-[#500000]"
          >
            <FacebookIcon className="size-5" />
          </Link>
          <Link
            href="/join-us"
            className="text-sm text-muted-foreground transition-colors hover:text-[#500000]"
          >
            Join the team
          </Link>
        </nav>
      </div>
    </footer>
  );
}
