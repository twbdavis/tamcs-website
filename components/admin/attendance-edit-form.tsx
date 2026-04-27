"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
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
import {
  addAttendanceRecordsAction,
  deleteAttendanceRecordAction,
  patchAttendanceRecordAction,
  updateAttendanceSessionMetaAction,
} from "@/app/actions/attendance";
import type {
  AttendanceRecord,
  AttendanceSemester,
  AttendanceSession,
} from "@/lib/content-types";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const CELL_INPUT =
  "w-full bg-transparent px-2 py-1 text-sm outline-none focus:bg-muted/40 focus:ring-1 focus:ring-[#500000]/40 rounded";

const SEMESTERS: AttendanceSemester[] = ["Fall", "Spring", "Summer"];

export function AttendanceEditForm({
  session,
  records,
  knownAthletes = [],
}: {
  session: AttendanceSession;
  records: AttendanceRecord[];
  knownAthletes?: KnownAthlete[];
}) {
  return (
    <div className="grid gap-8">
      <MetaSection session={session} />
      <RecordsSection records={records} />
      <AddRecordsSection
        sessionId={session.id}
        knownAthletes={knownAthletes}
      />
    </div>
  );
}

function MetaSection({ session }: { session: AttendanceSession }) {
  const [state, formAction, pending] = useActionState(
    updateAttendanceSessionMetaAction,
    null,
  );
  const router = useRouter();

  const [sessionDate, setSessionDate] = useState(session.session_date);
  const [title, setTitle] = useState(session.title);
  const [autoOverride, setAutoOverride] = useState(true); // start in override mode — values come from DB
  const [semester, setSemester] = useState<AttendanceSemester>(session.semester);
  const [academicYear, setAcademicYear] = useState(session.academic_year);

  const autoDerived = useMemo(() => {
    const dt = parseLocalDate(sessionDate);
    return dt ? semesterAndYearFor(dt) : null;
  }, [sessionDate]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    }
  }, [state, router]);

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold">Session details</h2>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="id" value={session.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="session_date">Date</Label>
            <Input
              id="session_date"
              name="session_date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              name="semester"
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
              name="academic_year"
              value={academicYear}
              onChange={(e) => {
                setAutoOverride(true);
                setAcademicYear(e.target.value);
              }}
              placeholder="2025-2026"
            />
          </div>
        </div>
        {autoDerived ? (
          <button
            type="button"
            onClick={() => {
              setAutoOverride(false);
              setSemester(autoDerived.semester);
              setAcademicYear(autoDerived.academic_year);
            }}
            className="justify-self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {autoOverride
              ? "Reset semester/year to match the date"
              : "Auto-derived from date"}
          </button>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function RecordsSection({ records }: { records: AttendanceRecord[] }) {
  const sorted = useMemo(
    () =>
      [...records].sort((a, b) =>
        a.athlete_name.localeCompare(b.athlete_name),
      ),
    [records],
  );

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Athletes ({records.length})</h2>
        <p className="text-xs text-muted-foreground">
          Click a cell to edit. Changes save on blur.
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No athletes recorded for this session.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">UIN (last 4)</th>
                <th className="px-3 py-2 text-center font-medium">
                  Restricted
                </th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <RecordRow key={r.id} record={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecordRow({ record }: { record: AttendanceRecord }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function patch(field: "athlete_name" | "uin_last4" | "is_restricted", value: string | boolean) {
    const fd = new FormData();
    fd.set("id", record.id);
    fd.set("field", field);
    fd.set("value", typeof value === "boolean" ? String(value) : value);
    startTransition(async () => {
      const res = await patchAttendanceRecordAction(null, fd);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Remove ${record.athlete_name} from this session?`)) {
      return;
    }
    const fd = new FormData();
    fd.set("id", record.id);
    startTransition(async () => {
      await deleteAttendanceRecordAction(fd);
      router.refresh();
    });
  }

  return (
    <tr className="border-t">
      <td className="px-1 py-1">
        <CellInput
          defaultValue={record.athlete_name}
          onCommit={(v) => patch("athlete_name", v)}
        />
      </td>
      <td className="px-1 py-1">
        <CellInput
          defaultValue={record.uin_last4 ?? ""}
          onCommit={(v) => patch("uin_last4", v)}
          placeholder="—"
          maxLength={4}
        />
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={record.is_restricted}
          onChange={(e) => patch("is_restricted", e.target.checked)}
        />
      </td>
      <td className="px-2 py-1 text-right">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleDelete}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}

function CellInput({
  defaultValue,
  onCommit,
  placeholder,
  maxLength,
}: {
  defaultValue: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== defaultValue) onCommit(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(defaultValue);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={CELL_INPUT}
    />
  );
}

function AddRecordsSection({
  sessionId,
  knownAthletes,
}: {
  sessionId: string;
  knownAthletes: KnownAthlete[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    addAttendanceRecordsAction,
    null,
  );
  const [roster, setRoster] = useState("");
  const [parsed, setParsed] = useState<ParsedRosterEntry[] | null>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      setRoster("");
      setParsed(null);
      router.refresh();
    }
  }, [state, router]);

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

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-lg font-semibold">Add more athletes</h2>
      {parsed === null ? (
        <div className="grid gap-3">
          <textarea
            rows={6}
            value={roster}
            onChange={(e) => setRoster(e.target.value)}
            placeholder={"Paste additional athletes in any of the supported formats…"}
            className={TEXTAREA_CLASS}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={handleParse} disabled={!roster.trim()}>
              Parse & preview
            </Button>
          </div>
        </div>
      ) : (
        <form action={formAction} className="grid gap-3">
          <input type="hidden" name="session_id" value={sessionId} />
          <input
            type="hidden"
            name="approved_entries"
            value={JSON.stringify(parsed)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="text-sm">
              <span className="font-semibold">{parsed.length}</span>{" "}
              <span className="text-xs text-muted-foreground">
                {parsed.length === 1 ? "athlete" : "athletes"} ready to add
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setParsed(null)}
              >
                ← Edit roster
              </Button>
              <Button type="submit" disabled={pending || parsed.length === 0}>
                {pending ? "Saving…" : "Add to session"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
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
                {parsed.map((p, idx) => (
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
                        onClick={() => removeRow(idx)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      )}
    </section>
  );
}
