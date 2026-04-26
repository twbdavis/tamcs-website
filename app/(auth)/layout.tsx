import Link from "next/link";
import { Footer } from "@/components/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Texas A&amp;M Club Swimming
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
