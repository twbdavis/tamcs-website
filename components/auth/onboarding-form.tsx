"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboardingAction } from "@/app/actions/onboarding";

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

export function OnboardingForm({
  defaults,
}: {
  defaults?: { first_name?: string; last_name?: string };
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            defaultValue={defaults?.first_name ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            defaultValue={defaults?.last_name ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="birthday">Birthday</Label>
          <Input id="birthday" name="birthday" type="date" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="class_year">Class year</Label>
          <select
            id="class_year"
            name="class_year"
            required
            defaultValue=""
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Choose…
            </option>
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
            required
            inputMode="numeric"
            pattern="\d{9}"
            maxLength={9}
            placeholder="123456789"
          />
          <p className="text-xs text-muted-foreground">
            Your nine-digit Texas A&amp;M Universal Identification Number.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone_number">Phone number</Label>
          <Input
            id="phone_number"
            name="phone_number"
            type="tel"
            required
            inputMode="tel"
            placeholder="(979) 555-0100"
          />
          <p className="text-xs text-muted-foreground">
            For team communication.
          </p>
        </div>
      </div>


      <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          name="constitution_agreed"
          required
          className="mt-0.5 size-4"
        />
        <span>
          I have read and agree to the{" "}
          <span className="font-semibold">TAMCS Constitution</span>.
        </span>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Finish onboarding"}
        </Button>
      </div>
    </form>
  );
}
