"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertSocialAction } from "@/app/actions/socials";
import type { Social } from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SocialForm({ social }: { social?: Social }) {
  const [state, formAction, pending] = useActionState(
    upsertSocialAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {social ? <input type="hidden" name="id" value={social.id} /> : null}

      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={social?.title ?? ""}
          placeholder="Pool day at Lake Bryan"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="event_date">Date</Label>
          <Input
            id="event_date"
            name="event_date"
            type="date"
            required
            defaultValue={social?.event_date ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="event_time">Time</Label>
          <Input
            id="event_time"
            name="event_time"
            type="time"
            defaultValue={social?.event_time ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={social?.location ?? ""}
          placeholder="Northgate or wherever the fun is"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={social?.description ?? ""}
          className={TEXTAREA_CLASS}
          placeholder="What's the plan? Bring anything? Cost?"
        />
      </div>

      <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={social ? social.is_published : true}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="font-medium">Publish</span>{" "}
          <span className="text-muted-foreground">
            — visible to athletes and on the public schedule
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : social ? "Save changes" : "Publish social"}
        </Button>
      </div>
    </form>
  );
}
