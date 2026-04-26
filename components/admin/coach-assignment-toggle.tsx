"use client";

import { toggleCoachAssignmentAction } from "@/app/actions/coaches";

export function CoachAssignmentToggle({
  scheduleId,
  coachId,
  name,
  assigned,
}: {
  scheduleId: string;
  coachId: string;
  name: string;
  assigned: boolean;
}) {
  return (
    <form action={toggleCoachAssignmentAction}>
      <input type="hidden" name="schedule_id" value={scheduleId} />
      <input type="hidden" name="coach_id" value={coachId} />
      <input type="hidden" name="next" value={assigned ? "false" : "true"} />
      <button
        type="submit"
        className={
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
          (assigned
            ? "border-[#500000] bg-[#500000] text-white hover:bg-[#3d0000]"
            : "border-input bg-background text-muted-foreground hover:bg-muted/40")
        }
        aria-pressed={assigned}
      >
        {assigned ? "✓ " : "+ "}
        {name}
      </button>
    </form>
  );
}
