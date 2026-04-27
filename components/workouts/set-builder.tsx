"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertWorkoutSetAction } from "@/app/actions/workouts";
import {
  WORKOUT_SECTION_COLORS,
  WORKOUT_SECTION_LABELS,
  type WorkoutSection,
  type WorkoutSectionType,
  type WorkoutSet,
} from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SECTION_TYPES: WorkoutSectionType[] = [
  "warmup",
  "preset",
  "kick",
  "pull",
  "main",
  "sprint",
];

type LocalSection = {
  // Stable key for React; the server assigns the real id on save.
  key: string;
  section_type: WorkoutSectionType;
  content: string;
  total_yardage: string; // string in input state to allow empty
};

function newKey() {
  return Math.random().toString(36).slice(2);
}

export function SetBuilder({
  set,
  initialSections,
}: {
  set?: WorkoutSet;
  initialSections?: WorkoutSection[];
}) {
  const [state, formAction, pending] = useActionState(
    upsertWorkoutSetAction,
    null,
  );
  const [title, setTitle] = useState(set?.title ?? "");
  const [sections, setSections] = useState<LocalSection[]>(() =>
    (initialSections ?? []).map((s) => ({
      key: s.id,
      section_type: s.section_type,
      content: s.content,
      total_yardage: s.total_yardage === null ? "" : String(s.total_yardage),
    })),
  );
  const [pickerType, setPickerType] = useState<WorkoutSectionType>("warmup");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const totalYardage = useMemo(() => {
    let n = 0;
    for (const s of sections) {
      const val = Number(s.total_yardage);
      if (Number.isFinite(val)) n += val;
    }
    return n;
  }, [sections]);

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        key: newKey(),
        section_type: pickerType,
        content: "",
        total_yardage: "",
      },
    ]);
  }

  function updateSection(idx: number, patch: Partial<LocalSection>) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  // Server payload: strip the React-only `key`, keep order implicit by index.
  const sectionsPayload = JSON.stringify(
    sections.map((s) => ({
      section_type: s.section_type,
      content: s.content,
      total_yardage: s.total_yardage === "" ? null : Number(s.total_yardage),
    })),
  );

  return (
    <form action={formAction} className="grid gap-6">
      {set ? <input type="hidden" name="id" value={set.id} /> : null}
      <input type="hidden" name="sections" value={sectionsPayload} />

      <div className="grid gap-1.5">
        <Label htmlFor="title">Set title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tuesday — distance focus"
        />
      </div>

      <div className="grid gap-4">
        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No sections yet. Pick a type below and click <em>Add section</em>.
          </p>
        ) : null}
        {sections.map((s, idx) => {
          const color = WORKOUT_SECTION_COLORS[s.section_type];
          return (
            <div
              key={s.key}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <div
                className={`flex items-center justify-between gap-2 px-4 py-2 ${color.bg} ${color.text}`}
              >
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {WORKOUT_SECTION_LABELS[s.section_type]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 hover:bg-white/15 disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="rounded p-1 hover:bg-white/15 disabled:opacity-40"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete section"
                    onClick={() => removeSection(idx)}
                    className="rounded p-1 hover:bg-white/15"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                <textarea
                  rows={5}
                  value={s.content}
                  onChange={(e) =>
                    updateSection(idx, { content: e.target.value })
                  }
                  placeholder={"4×100 free @ 1:30\n4×50 IM @ :60"}
                  className={TEXTAREA_CLASS}
                />
                <div className="grid gap-1.5 sm:max-w-xs">
                  <Label htmlFor={`yards-${s.key}`}>Total yardage</Label>
                  <Input
                    id={`yards-${s.key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={s.total_yardage}
                    onChange={(e) =>
                      updateSection(idx, { total_yardage: e.target.value })
                    }
                    placeholder="600"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="grid gap-1.5">
          <Label htmlFor="section-picker">Add section</Label>
          <select
            id="section-picker"
            value={pickerType}
            onChange={(e) =>
              setPickerType(e.target.value as WorkoutSectionType)
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {WORKOUT_SECTION_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" onClick={addSection}>
          + Add section
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Total yardage
          </div>
          <div className="text-2xl font-bold">{totalYardage.toLocaleString()}</div>
        </div>
        <Button type="submit" disabled={pending || sections.length === 0}>
          {pending ? "Submitting…" : set ? "Resubmit for review" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
