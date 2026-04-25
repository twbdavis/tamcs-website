"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertOfficerAction } from "@/app/actions/officers";
import type { Officer } from "@/lib/content-types";

export function OfficerForm({
  officer,
  redirectAfterSave,
}: {
  officer?: Officer;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertOfficerAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) {
        router.push(redirectAfterSave);
      } else if (!officer) {
        formRef.current?.reset();
      }
    }
  }, [state, officer, redirectAfterSave, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {officer ? <input type="hidden" name="id" value={officer.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={officer?.name ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            defaultValue={officer?.role ?? ""}
            required
            placeholder="President"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={officer?.email ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            defaultValue={officer?.year ?? ""}
            placeholder="Senior"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="display_order">Display order</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            defaultValue={officer?.display_order ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="photo_url">Photo URL</Label>
        <Input
          id="photo_url"
          name="photo_url"
          defaultValue={officer?.photo_url ?? ""}
          placeholder="https://…"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={officer?.bio ?? ""}
          rows={5}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : officer ? "Save changes" : "Add officer"}
        </Button>
      </div>
    </form>
  );
}
