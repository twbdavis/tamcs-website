"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertMeetAction } from "@/app/actions/meets";
import { AttachmentsEditor } from "@/components/admin/attachments-editor";
import type { Form, Meet } from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

export function MeetForm({
  meet,
  forms = [],
}: {
  meet?: Meet;
  forms?: Form[];
}) {
  const [state, formAction, pending] = useActionState(upsertMeetAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {meet ? <input type="hidden" name="id" value={meet.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={meet?.title ?? ""}
            placeholder="TXST Invitational"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="meet_date">Meet date</Label>
          <Input
            id="meet_date"
            name="meet_date"
            type="date"
            required
            defaultValue={meet?.meet_date ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          required
          defaultValue={meet?.location ?? ""}
          placeholder="Texas State University, San Marcos, TX"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={meet?.description ?? ""}
          className={TEXTAREA_CLASS}
          placeholder="What this meet is about, who's eligible, etc."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="signup_form_id">Signup form (team)</Label>
          <select
            id="signup_form_id"
            name="signup_form_id"
            defaultValue={meet?.signup_form_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">— None —</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
                {f.is_published ? "" : " (draft)"}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Pick a form built in Manage forms. Takes precedence over the URL
            below.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signup_deadline">Signup deadline</Label>
          <Input
            id="signup_deadline"
            name="signup_deadline"
            type="datetime-local"
            defaultValue={toLocalDatetimeInput(meet?.signup_deadline)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="signup_url">Signup URL (external)</Label>
        <Input
          id="signup_url"
          name="signup_url"
          type="url"
          defaultValue={meet?.signup_url ?? ""}
          placeholder="https://forms.gle/…"
        />
        <p className="text-xs text-muted-foreground">
          Used only when no team form is selected above.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="travel_info">Travel info</Label>
        <textarea
          id="travel_info"
          name="travel_info"
          rows={3}
          defaultValue={meet?.travel_info ?? ""}
          className={TEXTAREA_CLASS}
          placeholder="Carpooling details, departure time and location, hotel, etc."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="warmup_time">Warmup time</Label>
          <Input
            id="warmup_time"
            name="warmup_time"
            defaultValue={meet?.warmup_time ?? ""}
            placeholder="8:00 AM"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="event_start_time">Event start time</Label>
          <Input
            id="event_start_time"
            name="event_start_time"
            defaultValue={meet?.event_start_time ?? ""}
            placeholder="9:00 AM"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Attachments</Label>
        <AttachmentsEditor initial={meet?.attachments_urls ?? []} />
      </div>

      <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          name="is_published"
          // New meets default to published so they show up on the athlete
          // dashboard immediately. Existing meets reflect their current
          // state — uncheck to revert to draft.
          defaultChecked={meet ? meet.is_published : true}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="font-medium">Publish</span>{" "}
          <span className="text-muted-foreground">
            — visible on the athlete dashboard and public meets page
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : meet ? "Save changes" : "Create meet"}
        </Button>
      </div>
    </form>
  );
}
