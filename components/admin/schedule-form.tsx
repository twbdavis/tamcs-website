"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertCoachingScheduleAction } from "@/app/actions/schedule";
import type { CoachingScheduleEntry } from "@/lib/content-types";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function trimSeconds(t: string | undefined | null) {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function ScheduleForm({
  entry,
  redirectAfterSave,
}: {
  entry?: CoachingScheduleEntry;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [recurring, setRecurring] = useState<boolean>(entry?.recurring ?? true);

  const [state, formAction, pending] = useActionState(
    upsertCoachingScheduleAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) router.push(redirectAfterSave);
      else if (!entry) {
        formRef.current?.reset();
        setRecurring(true);
      }
    }
  }, [state, entry, redirectAfterSave, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={entry?.title ?? ""}
            required
            placeholder="Morning practice"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue={entry?.type ?? "practice"}
            required
            className={SELECT_CLASS}
          >
            <option value="practice">Practice</option>
            <option value="dryland">Dryland</option>
            <option value="meeting">Meeting</option>
            <option value="social">Social</option>
          </select>
        </div>
      </div>

      <fieldset className="grid gap-3 rounded-lg border p-4">
        <legend className="px-1 text-xs font-medium uppercase text-muted-foreground">
          When
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="recurring"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="size-4"
          />
          Recurs every week
        </label>

        {recurring ? (
          <div className="grid gap-1.5">
            <Label htmlFor="day_of_week">Day</Label>
            <select
              id="day_of_week"
              name="day_of_week"
              defaultValue={entry?.day_of_week ?? 1}
              required
              className={SELECT_CLASS}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="specific_date">Date</Label>
            <Input
              id="specific_date"
              name="specific_date"
              type="date"
              defaultValue={entry?.specific_date ?? ""}
              required={!recurring}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="start_time">Start</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={trimSeconds(entry?.start_time) || "19:30"}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="end_time">End</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={trimSeconds(entry?.end_time) || "21:00"}
              required
            />
          </div>
        </div>

        {recurring ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="effective_from">Effective from (optional)</Label>
              <Input
                id="effective_from"
                name="effective_from"
                type="date"
                defaultValue={entry?.effective_from ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="effective_to">Effective until (optional)</Label>
              <Input
                id="effective_to"
                name="effective_to"
                type="date"
                defaultValue={entry?.effective_to ?? ""}
              />
            </div>
          </div>
        ) : null}
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={entry?.location ?? ""}
            placeholder="Student Rec Natatorium"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="display_order">Order</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            defaultValue={entry?.display_order ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={entry?.notes ?? ""}
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : entry ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </form>
  );
}
