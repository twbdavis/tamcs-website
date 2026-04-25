"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertMeetResultAction } from "@/app/actions/meet-results";
import type { MeetResult } from "@/lib/content-types";

export function MeetResultForm({
  meet,
  redirectAfterSave,
}: {
  meet?: MeetResult;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertMeetResultAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) router.push(redirectAfterSave);
      else if (!meet) formRef.current?.reset();
    }
  }, [state, meet, redirectAfterSave, router]);

  const resultsDefault =
    meet?.results !== undefined
      ? JSON.stringify(meet.results, null, 2)
      : "[\n  {\n    \"event\": \"100 Free\",\n    \"swimmer\": \"Jane Doe\",\n    \"time\": \"55.21\",\n    \"place\": 3\n  }\n]";

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {meet ? <input type="hidden" name="id" value={meet.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="meet_name">Meet name</Label>
          <Input
            id="meet_name"
            name="meet_name"
            defaultValue={meet?.meet_name ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={meet?.date ?? ""}
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={meet?.location ?? ""}
          placeholder="Texas State University, San Marcos, TX"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="results">Results (JSON)</Label>
        <textarea
          id="results"
          name="results"
          defaultValue={resultsDefault}
          rows={10}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          An array of result objects, e.g.{" "}
          <code>{"{ event, swimmer, time, place }"}</code>.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={meet?.notes ?? ""}
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : meet ? "Save changes" : "Add meet"}
        </Button>
      </div>
    </form>
  );
}
