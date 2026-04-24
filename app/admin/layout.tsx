import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: proxy.ts already redirects unauthorized users,
  // but this enforces it again server-side in case proxy is bypassed.
  await requireRole(["officer", "admin"]);

  return (
    <>
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
