"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMySettingsAction } from "@/app/actions/settings";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    phone_number: string | null;
    instagram_handle: string | null;
    snapchat_handle: string | null;
    linkedin_handle: string | null;
    show_phone: boolean;
    show_instagram: boolean;
    show_snapchat: boolean;
    show_linkedin: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateMySettingsAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-5">
      <FieldWithVisibility
        id="phone_number"
        label="Phone number"
        type="tel"
        inputMode="tel"
        placeholder="(979) 555-0100"
        defaultValue={defaults.phone_number ?? ""}
        showCheckboxName="show_phone"
        defaultShow={defaults.show_phone}
      />
      <FieldWithVisibility
        id="instagram_handle"
        label="Instagram"
        placeholder="@yourhandle"
        defaultValue={defaults.instagram_handle ?? ""}
        showCheckboxName="show_instagram"
        defaultShow={defaults.show_instagram}
        maxLength={60}
      />
      <FieldWithVisibility
        id="snapchat_handle"
        label="Snapchat"
        placeholder="yourhandle"
        defaultValue={defaults.snapchat_handle ?? ""}
        showCheckboxName="show_snapchat"
        defaultShow={defaults.show_snapchat}
        maxLength={60}
      />
      <FieldWithVisibility
        id="linkedin_handle"
        label="LinkedIn"
        placeholder="https://www.linkedin.com/in/your-handle"
        defaultValue={defaults.linkedin_handle ?? ""}
        showCheckboxName="show_linkedin"
        defaultShow={defaults.show_linkedin}
        maxLength={200}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function FieldWithVisibility({
  id,
  label,
  type,
  inputMode,
  placeholder,
  defaultValue,
  showCheckboxName,
  defaultShow,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  inputMode?: "tel" | "text";
  placeholder?: string;
  defaultValue: string;
  showCheckboxName: string;
  defaultShow: boolean;
  maxLength?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name={showCheckboxName}
          defaultChecked={defaultShow}
          className="size-4"
        />
        <span>
          Show on the <span className="font-medium">Team socials</span>{" "}
          directory
        </span>
      </label>
    </div>
  );
}
