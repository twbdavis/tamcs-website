"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseLocalDate,
  parseRoster,
  semesterAndYearFor,
  type KnownAthlete,
  type ParsedRosterEntry,
} from "@/lib/attendance";
import { createAttendanceSessionAction } from "@/app/actions/attendance";
import type { AttendanceSemester } from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AttendanceLogger({
  knownAthletes = [],
}: {
  knownAthletes?: KnownAthlete[];
} = {}) {
  const [sessionDate, setSessionDate] = useState(todayLocal());
  const [title, setTitle] = useState("Practice");
  const [autoOverride, setAutoOverride] = useState(false);
  const [semester, setSemester] = useState<AttendanceSemester>("Fall");
  const [academicYear, setAcademicYear] = useState("");
  const [roster, setRoster] = useState("");
  const [parsed, setParsed] = useState<ParsedRosterEntry[] | null>(null);
  const [state, formAction, pending] = useActionState(
    createAttendanceSessionAction,
    null,
  );

  // Auto-derive semester/year from the date until the user manually overrides.
  const autoDerived = useMemo(() => {
    const dt = parseLocalDate(sessionDate);
    if (!dt) return null;
    return semesterAndYearFor(dt);
  }, [sessionDate]);

  useEffect(() => {
    if (!autoOverride && autoDerived) {
      setSemester(autoDerived.semester);
      setAcademicYear(autoDerived.academic_year);
    }
  }, [autoDerived, autoOverride]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const parseCount = parsed?.length ?? 0;

  function handleParse() {
    const out = parseRoster(roster, knownAthletes);
    if (out.length === 0) {
      toast.error("No names parsed — check the format.");
      return;
    }
    setParsed(out);
  }

  function removeRow(idx: number) {
    setParsed((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  }

  function startOver() {
    setParsed(null);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor="session_date">Date</Label>
          <Input
            id="session_date"
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Practice"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="semester">Semester</Label>
          <select
            id="semester"
            value={semester}
            onChange={(e) => {
              setAutoOverride(true);
              setSemester(e.target.value as AttendanceSemester);
            }}
            className={SELECT_CLASS}
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="academic_year">Academic year</Label>
          <Input
            id="academic_year"
            value={academicYear}
            onChange={(e) => {
              setAutoOverride(true);
              setAcademicYear(e.target.value);
            }}
            placeholder="2025-2026"
          />
        </div>
      </div>
      {autoOverride ? (
        <div>
          <button
            type="button"
            onClick={() => setAutoOverride(false)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Reset semester/year to match the date
          </button>
        </div>
      ) : null}

      {parsed === null ? (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="roster">Paste roster</Label>
            <textarea
              id="roster"
              rows={12}
              value={roster}
              onChange={(e) => setRoster(e.target.value)}
              placeholder={
                "Aarna Shukla (*****4398)\nAbbey Cross (*****8067)\nSofia Rodriguez (*****3901) (Restricted)"
              }
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-muted-foreground">
              Three formats accepted:{" "}
              <code>Full Name (*****1234)</code> per line (append{" "}
              <code>(Restricted)</code> if applicable), the tab-separated
              sportclubs.tamu.edu table paste (
              <code>First\tLast\tUIN\tRemove</code>), or the raw
              concatenated blob (
              <code>AbigailBernero935001382Remove…</code>).
            </p>
          </div>
          <div className="flex items-center justify-end">
            <Button type="button" onClick={handleParse} disabled={!roster.trim()}>
              Parse & preview
            </Button>
          </div>
        </>
      ) : (
        <PreviewAndSave
          sessionDate={sessionDate}
          title={title}
          semester={semester}
          academicYear={academicYear}
          roster={roster}
          parsed={parsed}
          parseCount={parseCount}
          formAction={formAction}
          pending={pending}
          onRemoveRow={removeRow}
          onStartOver={startOver}
        />
      )}
    </div>
  );
}

function PreviewAndSave({
  sessionDate,
  title,
  semester,
  academicYear,
  roster,
  parsed,
  parseCount,
  formAction,
  pending,
  onRemoveRow,
  onStartOver,
}: {
  sessionDate: string;
  title: string;
  semester: AttendanceSemester;
  academicYear: string;
  roster: string;
  parsed: ParsedRosterEntry[];
  parseCount: number;
  formAction: (fd: FormData) => void;
  pending: boolean;
  onRemoveRow: (idx: number) => void;
  onStartOver: () => void;
}) {
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="session_date" value={sessionDate} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="semester" value={semester} />
      <input type="hidden" name="academic_year" value={academicYear} />
      <input type="hidden" name="roster" value={roster} />
      <input
        type="hidden"
        name="approved_entries"
        value={JSON.stringify(parsed)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
        <div>
          <span className="text-sm font-semibold">{parseCount}</span>{" "}
          <span className="text-xs text-muted-foreground">
            {parseCount === 1 ? "athlete" : "athletes"} ready to save
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onStartOver}>
            ← Edit roster
          </Button>
          <Button type="submit" disabled={pending || parsed.length === 0}>
            {pending ? "Saving…" : "Confirm & save"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">UIN (last 4)</th>
              <th className="px-3 py-2 font-medium">Restricted</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parsed.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  All rows removed.
                </td>
              </tr>
            ) : (
              parsed.map((p, idx) => (
                <tr key={`${p.athlete_name}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{p.athlete_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.uin_last4 ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {p.is_restricted ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Restricted
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveRow(idx)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </form>
  );
}
