import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { requireMinRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin section is for admins and the president. Officers manage nothing
  // here — they get a read-only view on /dashboard.
  // Belt-and-suspenders: proxy.ts already redirects unauthorized users.
  await requireMinRole("admin");

  return (
    <>
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
