"use client";

import { Button } from "@/components/ui/button";
import type {
  AttendanceRecord,
  AttendanceSession,
} from "@/lib/content-types";

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: string[][]) {
  const text = rows
    .map((row) => row.map((c) => csvEscape(String(c ?? ""))).join(","))
    .join("\r\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AttendanceCsvButtons({
  sessions,
  records,
}: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
}) {
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  function exportRecords() {
    const headers = [
      "session_date",
      "title",
      "semester",
      "academic_year",
      "athlete_name",
      "uin_last4",
      "is_restricted",
    ];
    const rows: string[][] = [headers];
    for (const r of records) {
      const s = sessionsById.get(r.session_id);
      rows.push([
        s?.session_date ?? "",
        s?.title ?? "",
        s?.semester ?? "",
        s?.academic_year ?? "",
        r.athlete_name,
        r.uin_last4 ?? "",
        String(r.is_restricted),
      ]);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`tamcs-attendance-${stamp}.csv`, rows);
  }

  function exportTotals() {
    const totals = new Map<
      string,
      { name: string; uin: string | null; count: number }
    >();
    for (const r of records) {
      const key = `${r.athlete_name.trim().toLowerCase()}|${r.uin_last4 ?? ""}`;
      const existing = totals.get(key);
      if (existing) existing.count++;
      else totals.set(key, { name: r.athlete_name, uin: r.uin_last4, count: 1 });
    }
    const rows: string[][] = [["athlete_name", "uin_last4", "attendance_count"]];
    for (const t of Array.from(totals.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    )) {
      rows.push([t.name, t.uin ?? "", String(t.count)]);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`tamcs-attendance-totals-${stamp}.csv`, rows);
  }

  const empty = records.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={exportRecords}
        disabled={empty}
      >
        Export sessions CSV
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={exportTotals}
        disabled={empty}
      >
        Export totals CSV
      </Button>
    </div>
  );
}
