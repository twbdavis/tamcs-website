import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { EmailListSpreadsheet } from "@/components/admin/email-list-spreadsheet";
import type { EmailListEntry } from "@/lib/content-types";

export const metadata = { title: "Email List" };

export default async function EmailListPage() {
  await requireMinRole("officer");

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("email_list")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .returns<EmailListEntry[]>();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <header>
        <h1 className="text-3xl font-bold">Team email list</h1>
        <p className="mt-1 text-muted-foreground">
          Spreadsheet-style view of every contact. Click any cell to edit;
          changes save automatically. New approved athletes are added here
          automatically.
        </p>
      </header>

      <section className="mt-6">
        <EmailListSpreadsheet initial={entries ?? []} />
      </section>
    </div>
  );
}
