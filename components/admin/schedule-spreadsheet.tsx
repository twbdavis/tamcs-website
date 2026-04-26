"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
// `useMemo` import kept for sortedRows. coachById was once used for sorting
// — currently coaches arrive pre-sorted from the server.
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { DAY_LABELS, formatTime, formatSpecificDate } from "@/lib/schedule";
import {
  updatePracticeCellAction,
  createBlankPracticeAction,
  deleteCoachingScheduleAction,
} from "@/app/actions/schedule";
import { toggleCoachAssignmentAction } from "@/app/actions/coaches";
import type {
  Coach,
  CoachAssignment,
  CoachingScheduleEntry,
  DayOfWeek,
} from "@/lib/content-types";

const TYPE_OPTIONS: { value: CoachingScheduleEntry["type"]; label: string }[] = [
  { value: "practice", label: "Practice" },
  { value: "dryland", label: "Dryland" },
  { value: "meeting", label: "Meeting" },
  { value: "social", label: "Social" },
];

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

type Field =
  | "title"
  | "specific_date"
  | "effective_from"
  | "day_of_week"
  | "start_time"
  | "end_time"
  | "location"
  | "type"
  | "notes";

function trimSeconds(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function rowAnchorKey(p: CoachingScheduleEntry): string {
  // Sort key: one-off by specific_date, recurring by effective_from then
  // day_of_week. Nulls sort last.
  if (p.specific_date) return `0:${p.specific_date}:${p.start_time}`;
  if (p.effective_from)
    return `1:${p.effective_from}:${String(p.day_of_week ?? 9)}:${p.start_time}`;
  return `2:${String(p.day_of_week ?? 9)}:${p.start_time}`;
}

function dateForRow(p: CoachingScheduleEntry): string {
  return p.recurring ? p.effective_from ?? "" : p.specific_date ?? "";
}

function dateFieldFor(p: CoachingScheduleEntry): Field {
  return p.recurring ? "effective_from" : "specific_date";
}

function dayLabelFor(p: CoachingScheduleEntry): string {
  if (p.recurring && p.day_of_week !== null) return DAY_LABELS[p.day_of_week];
  if (!p.recurring && p.specific_date) {
    const [y, m, d] = p.specific_date.split("-").map(Number);
    if (y && m && d) {
      const dow = new Date(y, m - 1, d).getDay() as DayOfWeek;
      return DAY_LABELS[dow];
    }
  }
  return "—";
}

export function ScheduleSpreadsheet({
  initial,
  coaches,
  initialAssignments,
  canEdit,
}: {
  initial: CoachingScheduleEntry[];
  coaches: Coach[];
  initialAssignments: CoachAssignment[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<CoachingScheduleEntry[]>(initial);
  const [coachMap, setCoachMap] = useState<Map<string, Set<string>>>(() => {
    const m = new Map<string, Set<string>>();
    for (const a of initialAssignments) {
      const s = m.get(a.schedule_id) ?? new Set<string>();
      s.add(a.coach_id);
      m.set(a.schedule_id, s);
    }
    return m;
  });
  const [pending, startTransition] = useTransition();

  // Refresh local state if the server sends new data via revalidatePath.
  useEffect(() => setRows(initial), [initial]);
  useEffect(() => {
    const m = new Map<string, Set<string>>();
    for (const a of initialAssignments) {
      const s = m.get(a.schedule_id) ?? new Set<string>();
      s.add(a.coach_id);
      m.set(a.schedule_id, s);
    }
    setCoachMap(m);
  }, [initialAssignments]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        rowAnchorKey(a).localeCompare(rowAnchorKey(b)),
      ),
    [rows],
  );

  async function commitCell(rowId: string, field: Field, value: string) {
    const fd = new FormData();
    fd.append("id", rowId);
    fd.append("field", field);
    fd.append("value", value);
    const result = await updatePracticeCellAction(null, fd);
    if (result.error) {
      toast.error(result.error);
      // Server is still source of truth; refresh to roll back.
      router.refresh();
      return false;
    }
    return true;
  }

  function patchRow(id: string, patch: Partial<CoachingScheduleEntry>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleEdit(
    row: CoachingScheduleEntry,
    field: Field,
    value: string,
    optimistic: Partial<CoachingScheduleEntry>,
  ) {
    patchRow(row.id, optimistic);
    startTransition(async () => {
      await commitCell(row.id, field, value);
    });
  }

  function addRow() {
    startTransition(async () => {
      const result = await createBlankPracticeAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function deleteRow(p: CoachingScheduleEntry) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    setRows((prev) => prev.filter((r) => r.id !== p.id));
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", p.id);
      await deleteCoachingScheduleAction(fd);
    });
  }

  async function toggleCoach(scheduleId: string, coachId: string) {
    const current = coachMap.get(scheduleId) ?? new Set<string>();
    const isOn = current.has(coachId);
    // Optimistic
    setCoachMap((prev) => {
      const next = new Map(prev);
      const s = new Set(next.get(scheduleId) ?? []);
      if (isOn) s.delete(coachId);
      else s.add(coachId);
      next.set(scheduleId, s);
      return next;
    });
    const fd = new FormData();
    fd.append("schedule_id", scheduleId);
    fd.append("coach_id", coachId);
    fd.append("next", isOn ? "false" : "true");
    startTransition(async () => {
      await toggleCoachAssignmentAction(fd);
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Click any cell to edit. Changes save automatically."
            : "Read-only view. The president edits this schedule."}
        </p>
        {canEdit ? (
          <Button onClick={addRow} disabled={pending} size="sm">
            <Plus className="mr-1 size-3.5" /> Add row
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <Th>Title</Th>
              <Th>Date</Th>
              <Th>Day</Th>
              <Th>Time</Th>
              <Th>Location</Th>
              <Th>Type</Th>
              <Th>Coaches</Th>
              <Th>Notes</Th>
              {canEdit ? <Th className="w-10"> </Th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 9 : 8}
                  className="p-6 text-center text-muted-foreground"
                >
                  No practices yet.
                </td>
              </tr>
            ) : (
              sortedRows.map((p) => {
                const assignedIds =
                  coachMap.get(p.id) ?? new Set<string>();
                const assignedCoaches = coaches.filter((c) =>
                  assignedIds.has(c.id),
                );
                return (
                  <tr key={p.id} className="border-t">
                    <TextCell
                      canEdit={canEdit}
                      value={p.title}
                      onCommit={(v) =>
                        handleEdit(p, "title", v, { title: v })
                      }
                    />
                    <DateCell
                      canEdit={canEdit}
                      value={dateForRow(p)}
                      display={
                        dateForRow(p)
                          ? formatSpecificDate(dateForRow(p))
                          : p.recurring
                            ? "—"
                            : ""
                      }
                      onCommit={(v) =>
                        handleEdit(
                          p,
                          dateFieldFor(p),
                          v,
                          p.recurring
                            ? { effective_from: v || null }
                            : { specific_date: v || null },
                        )
                      }
                    />
                    {p.recurring ? (
                      <SelectCell
                        canEdit={canEdit}
                        value={String(p.day_of_week ?? "")}
                        display={dayLabelFor(p)}
                        options={DAYS.map((d) => ({
                          value: String(d.value),
                          label: d.label,
                        }))}
                        onCommit={(v) => {
                          const n = Number(v) as DayOfWeek;
                          handleEdit(p, "day_of_week", v, { day_of_week: n });
                        }}
                      />
                    ) : (
                      <td className="px-3 py-2 text-muted-foreground">
                        {dayLabelFor(p)}
                      </td>
                    )}
                    <TimeRangeCell
                      canEdit={canEdit}
                      start={trimSeconds(p.start_time)}
                      end={trimSeconds(p.end_time)}
                      onCommit={(start, end) => {
                        if (start !== trimSeconds(p.start_time)) {
                          handleEdit(p, "start_time", start, {
                            start_time: start,
                          });
                        }
                        if (end !== trimSeconds(p.end_time)) {
                          handleEdit(p, "end_time", end, { end_time: end });
                        }
                      }}
                    />
                    <TextCell
                      canEdit={canEdit}
                      value={p.location ?? ""}
                      placeholder="—"
                      onCommit={(v) =>
                        handleEdit(p, "location", v, {
                          location: v.trim() === "" ? null : v.trim(),
                        })
                      }
                    />
                    <SelectCell
                      canEdit={canEdit}
                      value={p.type}
                      display={
                        TYPE_OPTIONS.find((o) => o.value === p.type)?.label ??
                        p.type
                      }
                      options={TYPE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                      onCommit={(v) =>
                        handleEdit(p, "type", v, {
                          type: v as CoachingScheduleEntry["type"],
                        })
                      }
                    />
                    <CoachesCell
                      canEdit={canEdit}
                      coaches={coaches}
                      assigned={assignedCoaches}
                      onToggle={(coachId) => toggleCoach(p.id, coachId)}
                    />
                    <TextCell
                      canEdit={canEdit}
                      value={p.notes ?? ""}
                      placeholder="—"
                      onCommit={(v) =>
                        handleEdit(p, "notes", v, {
                          notes: v.trim() === "" ? null : v.trim(),
                        })
                      }
                    />
                    {canEdit ? (
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          aria-label="Delete row"
                          onClick={() => deleteRow(p)}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={"px-3 py-2 font-medium " + (className ?? "")}>{children}</th>;
}

// ─── editable cell primitives ───────────────────────────────────────────────

function CellShell({
  canEdit,
  display,
  onActivate,
  className,
}: {
  canEdit: boolean;
  display: React.ReactNode;
  onActivate: () => void;
  className?: string;
}) {
  return (
    <td
      onClick={canEdit ? onActivate : undefined}
      className={
        "px-3 py-2 align-top " +
        (canEdit ? "cursor-pointer hover:bg-muted/40 " : "") +
        (className ?? "")
      }
    >
      {display}
    </td>
  );
}

function TextCell({
  canEdit,
  value,
  placeholder,
  onCommit,
}: {
  canEdit: boolean;
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <CellShell
        canEdit={canEdit}
        onActivate={() => setEditing(true)}
        display={
          value ? (
            <span>{value}</span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder ?? (canEdit ? "Click to edit" : "")}
            </span>
          )
        }
      />
    );
  }
  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }
  return (
    <td className="px-1 py-1 align-top">
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      />
    </td>
  );
}

function DateCell({
  canEdit,
  value,
  display,
  onCommit,
}: {
  canEdit: boolean;
  value: string;
  display: string;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <CellShell
        canEdit={canEdit}
        onActivate={() => setEditing(true)}
        display={
          display ? (
            <span>{display}</span>
          ) : (
            <span className="text-muted-foreground">
              {canEdit ? "Click to edit" : "—"}
            </span>
          )
        }
      />
    );
  }
  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }
  return (
    <td className="px-1 py-1 align-top">
      <input
        ref={ref}
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      />
    </td>
  );
}

function SelectCell({
  canEdit,
  value,
  display,
  options,
  onCommit,
}: {
  canEdit: boolean;
  value: string;
  display: string;
  options: { value: string; label: string }[];
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <CellShell
        canEdit={canEdit}
        onActivate={() => setEditing(true)}
        display={<span>{display}</span>}
      />
    );
  }
  function commit(next: string) {
    setEditing(false);
    if (next !== value) onCommit(next);
  }
  return (
    <td className="px-1 py-1 align-top">
      <select
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </td>
  );
}

function TimeRangeCell({
  canEdit,
  start,
  end,
  onCommit,
}: {
  canEdit: boolean;
  start: string;
  end: string;
  onCommit: (start: string, end: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);
  useEffect(() => setS(start), [start]);
  useEffect(() => setE(end), [end]);

  if (!editing) {
    return (
      <CellShell
        canEdit={canEdit}
        onActivate={() => setEditing(true)}
        display={
          <span>
            {start ? formatTime(start) : "—"} – {end ? formatTime(end) : "—"}
          </span>
        }
      />
    );
  }

  function commit() {
    setEditing(false);
    if (s !== start || e !== end) onCommit(s, e);
  }
  return (
    <td className="px-1 py-1 align-top">
      <div className="flex items-center gap-1">
        <input
          type="time"
          value={s}
          onChange={(ev) => setS(ev.target.value)}
          onBlur={commit}
          className="h-8 w-24 rounded border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="time"
          value={e}
          onChange={(ev) => setE(ev.target.value)}
          onBlur={commit}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              commit();
            } else if (ev.key === "Escape") {
              setS(start);
              setE(end);
              setEditing(false);
            }
          }}
          className="h-8 w-24 rounded border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
    </td>
  );
}

function CoachesCell({
  canEdit,
  coaches,
  assigned,
  onToggle,
}: {
  canEdit: boolean;
  coaches: Coach[];
  assigned: Coach[];
  onToggle: (coachId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const display =
    assigned.length > 0
      ? assigned.map((c) => c.name).join(", ")
      : "No coaches assigned";

  if (!canEdit) {
    return (
      <td className="px-3 py-2 align-top">
        <span
          className={
            assigned.length > 0
              ? ""
              : "italic text-muted-foreground"
          }
        >
          {display}
        </span>
      </td>
    );
  }

  return (
    <td className="px-3 py-2 align-top">
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={
            "min-h-8 w-full rounded border border-input bg-background px-2 py-1 text-left text-sm hover:bg-muted/40 " +
            (assigned.length === 0 ? "italic text-muted-foreground" : "")
          }
        >
          {display}
        </button>
        {open ? (
          <div className="absolute left-0 z-20 mt-1 w-60 rounded-lg border bg-card p-2 shadow-lg">
            {coaches.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">
                Add coaches to the roster on the assignments page first.
              </p>
            ) : (
              <ul className="grid gap-1">
                {coaches.map((c) => {
                  const checked = assigned.some((a) => a.id === c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/40">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(c.id)}
                          className="size-4"
                        />
                        {c.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </td>
  );
}
