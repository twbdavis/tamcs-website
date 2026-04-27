"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertAnnouncementAction } from "@/app/actions/announcements";
import type { WeeklyAnnouncement } from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function toLocalDatetimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function AnnouncementForm({
  announcement,
}: {
  announcement?: WeeklyAnnouncement;
}) {
  const [state, formAction, pending] = useActionState(
    upsertAnnouncementAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {announcement ? (
        <input type="hidden" name="id" value={announcement.id} />
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          required
          defaultValue={announcement?.subject ?? ""}
          placeholder="Weekly update — Mar 24"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="sender">Sender (optional)</Label>
          <Input
            id="sender"
            name="sender"
            defaultValue={announcement?.sender ?? ""}
            placeholder="officers@tamcs.org"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="received_at">Received (optional)</Label>
          <Input
            id="received_at"
            name="received_at"
            type="datetime-local"
            defaultValue={toLocalDatetimeInput(announcement?.received_at)}
          />
          <p className="text-xs text-muted-foreground">
            Defaults to now when left blank.
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={10}
          required
          defaultValue={announcement?.body ?? ""}
          className={TEXTAREA_CLASS}
        />
      </div>

      <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={announcement ? announcement.is_published : true}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="font-medium">Publish</span>{" "}
          <span className="text-muted-foreground">
            — visible on the announcements page
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : announcement
              ? "Save changes"
              : "Create announcement"}
        </Button>
      </div>
    </form>
  );
}
