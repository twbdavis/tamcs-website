import { Suspense } from "react";
import { TopNav } from "@/components/nav/top-nav";
import { Footer } from "@/components/footer";
import { DashboardToast } from "@/components/auth/dashboard-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      <Suspense>
        <DashboardToast />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
