import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScheduleEvent } from "@/lib/content-types";

export const metadata = { title: "Schedule" };

const TYPE_LABELS: Record<ScheduleEvent["type"], string> = {
  practice: "Practice",
  meet: "Meet",
  social: "Social",
  other: "Event",
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: events } = await supabase
    .from("schedule_events")
    .select("*")
    .gte("date", nowIso)
    .order("date", { ascending: true })
    .returns<ScheduleEvent[]>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Schedule</h1>
        <p className="mt-2 text-muted-foreground">
          Upcoming practices, meets, and team events.
        </p>
      </header>

      {!events || events.length === 0 ? (
        <p className="text-muted-foreground">No upcoming events scheduled.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(e.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {e.title}
                    {e.description ? (
                      <p className="mt-1 whitespace-normal text-xs font-normal text-muted-foreground">
                        {e.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{TYPE_LABELS[e.type]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.location ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
