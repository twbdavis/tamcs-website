"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reviewWorkoutSetAction } from "@/app/actions/workouts";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ReviewForm({ setId }: { setId: string }) {
  const [state, formAction, pending] = useActionState(
    reviewWorkoutSetAction,
    null,
  );
  const [decision, setDecision] = useState<"approved" | "denied" | null>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={setId} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      <div className="grid gap-1.5">
        <Label htmlFor="review_comment">Comments (optional)</Label>
        <textarea
          id="review_comment"
          name="review_comment"
          rows={3}
          placeholder="Optional feedback for the coach"
          className={TEXTAREA_CLASS}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending}
          onClick={() => setDecision("approved")}
        >
          {pending && decision === "approved" ? "Approving…" : "Approve"}
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={pending}
          onClick={() => setDecision("denied")}
        >
          {pending && decision === "denied" ? "Denying…" : "Deny"}
        </Button>
      </div>
    </form>
  );
}
