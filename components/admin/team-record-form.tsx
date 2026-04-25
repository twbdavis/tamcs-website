"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertTeamRecordAction } from "@/app/actions/team-records";
import type { TeamRecord } from "@/lib/content-types";

export function TeamRecordForm({
  record,
  redirectAfterSave,
}: {
  record?: TeamRecord;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertTeamRecordAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) router.push(redirectAfterSave);
      else if (!record) formRef.current?.reset();
    }
  }, [state, record, redirectAfterSave, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="event">Event</Label>
          <Input
            id="event"
            name="event"
            defaultValue={record?.event ?? ""}
            placeholder="100 Free"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={record?.category ?? "women"}
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="swimmer_name">Swimmer (or relay names)</Label>
          <Input
            id="swimmer_name"
            name="swimmer_name"
            defaultValue={record?.swimmer_name ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            defaultValue={record?.year ?? ""}
            placeholder="2024"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            name="time"
            defaultValue={record?.time ?? ""}
            placeholder="1:42.31"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="display_order">Display order</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            defaultValue={record?.display_order ?? 0}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : record ? "Save changes" : "Add record"}
        </Button>
      </div>
    </form>
  );
}
