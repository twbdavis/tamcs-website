import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { requireMinRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Officers can manage /admin/forms; everything else under /admin requires
  // admin+. proxy.ts is the real gate (it lets officers through /admin/forms
  // and blocks them elsewhere); this layout just backstops with the lowest
  // role that has any /admin access.
  await requireMinRole("officer");

  return (
    <>
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
