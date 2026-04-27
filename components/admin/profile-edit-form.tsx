"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/app/actions/profiles";
import type { Profile } from "@/lib/types";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CLASS_YEARS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "5th Year",
  "Graduate",
] as const;

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={profile.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            defaultValue={profile.first_name ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            defaultValue={profile.last_name ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={profile.email ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            defaultValue={profile.birthday ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="class_year">Class year</Label>
          <select
            id="class_year"
            name="class_year"
            defaultValue={profile.class_year ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">—</option>
            {CLASS_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="uin">UIN</Label>
          <Input
            id="uin"
            name="uin"
            inputMode="numeric"
            pattern="\d{9}"
            maxLength={9}
            defaultValue={profile.uin ?? ""}
            placeholder="123456789"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone_number">Phone number</Label>
          <Input
            id="phone_number"
            name="phone_number"
            type="tel"
            inputMode="tel"
            defaultValue={profile.phone_number ?? ""}
            placeholder="(979) 555-0100"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
