import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecordCategory, TeamRecord } from "@/lib/content-types";

export const metadata = { title: "Team Records" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<RecordCategory, string> = {
  women: "Women's Records",
  men: "Men's Records",
  mixed: "Mixed Records",
};

const SECTION_ORDER: RecordCategory[] = ["women", "men", "mixed"];

export default async function TeamRecordsPage() {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("team_records")
    .select("*")
    .order("display_order", { ascending: true })
    .returns<TeamRecord[]>();

  const buckets: Record<RecordCategory, TeamRecord[]> = {
    women: [],
    men: [],
    mixed: [],
  };
  for (const r of records ?? []) {
    buckets[r.category].push(r);
  }
  const sections = SECTION_ORDER
    .map((category) => ({ category, rows: buckets[category] }))
    .filter((s) => s.rows.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Team Records</h1>
        <p className="mt-2 text-muted-foreground">
          All-time fastest times in TAMCS history.
        </p>
      </header>

      {sections.length === 0 ? (
        <p className="text-muted-foreground">No records on file yet.</p>
      ) : (
        <div className="space-y-12">
          {sections.map(({ category, rows }) => (
            <section key={category}>
              <h2 className="mb-4 text-2xl font-semibold">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[28%]">Event</TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead className="w-[12%]">Year</TableHead>
                      <TableHead className="w-[15%] text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.event}</TableCell>
                        <TableCell className="whitespace-normal">
                          {r.swimmer_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.year ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r.time}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
