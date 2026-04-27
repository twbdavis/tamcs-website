import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMinRole } from "@/lib/auth/require-role";
import { AttendanceEditForm } from "@/components/admin/attendance-edit-form";
import type { KnownAthlete } from "@/lib/attendance";
import type {
  AttendanceRecord,
  AttendanceSession,
} from "@/lib/content-types";

export const metadata = { title: "Edit Attendance" };

export default async function EditAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMinRole("officer");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: session }, { data: records }, { data: profileRows }] =
    await Promise.all([
      supabase
        .from("attendance_sessions")
        .select("*")
        .eq("id", id)
        .single<AttendanceSession>(),
      supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", id)
        .order("athlete_name", { ascending: true })
        .returns<AttendanceRecord[]>(),
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .not("first_name", "is", null)
        .not("last_name", "is", null)
        .returns<{ first_name: string | null; last_name: string | null }[]>(),
    ]);

  if (!session) notFound();

  const knownAthletes: KnownAthlete[] = (profileRows ?? [])
    .filter((p) => p.first_name && p.last_name)
    .map((p) => ({
      first: p.first_name as string,
      last: p.last_name as string,
    }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard/attendance?tab=history"
          className="text-muted-foreground hover:text-primary"
        >
          ← Attendance history
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit session</h1>
      <p className="mt-1 text-muted-foreground">
        {session.title} · {formatDate(session.session_date)} · {session.semester}{" "}
        {session.academic_year}
      </p>

      <div className="mt-8">
        <AttendanceEditForm
          session={session}
          records={records ?? []}
          knownAthletes={knownAthletes}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
