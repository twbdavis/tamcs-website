import Link from "next/link";
import { requireMinRole } from "@/lib/auth/require-role";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";

export const metadata = { title: "Invoice Builder" };

export default async function InvoicePage() {
  const { profile } = await requireMinRole("officer");
  const issuerName = profile?.full_name ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Invoice builder</h1>
      <p className="mt-1 text-muted-foreground">
        Fill in the details and download a branded PDF. Nothing is saved
        server-side.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <InvoiceBuilder issuerName={issuerName} />
      </section>
    </div>
  );
}
