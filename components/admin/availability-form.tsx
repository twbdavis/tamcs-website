"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAvailabilityAction } from "@/app/actions/availability";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function AvailabilityForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    addAvailabilityAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="day_of_week">Day</Label>
        <select
          id="day_of_week"
          name="day_of_week"
          defaultValue="monday"
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
      <div className="grid gap-1.5">
        <Label htmlFor="start_time">Start</Label>
        <Input
          id="start_time"
          name="start_time"
          type="time"
          defaultValue="09:00"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="end_time">End</Label>
        <Input
          id="end_time"
          name="end_time"
          type="time"
          defaultValue="10:00"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add block"}
      </Button>
    </form>
  );
}
