"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFormAction } from "@/app/actions/forms";

export function CreateFormButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createFormAction, null);

  useEffect(() => {
    // Success path triggers a redirect; only the error case lands here.
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="new-title">Title</Label>
          <Input
            id="new-title"
            name="title"
            required
            placeholder="Spring banquet RSVP"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-description">Description (optional)</Label>
        <Input
          id="new-description"
          name="description"
          placeholder="Let us know if you're coming."
        />
      </div>
    </form>
  );
}
