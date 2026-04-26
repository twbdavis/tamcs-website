"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateUserRoleAction } from "@/app/actions/users";
import type { UserRole } from "@/lib/types";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function RoleSelect({
  userId,
  currentRole,
  options,
  disabled,
}: {
  userId: string;
  currentRole: UserRole;
  options: UserRole[];
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    updateUserRoleAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  // Make sure the user's current role is selectable, even if it's outside the
  // caller's normal assignable set (e.g. an admin viewing a president).
  const merged = options.includes(currentRole)
    ? options
    : [currentRole, ...options];

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={disabled || pending}
        className={SELECT_CLASS}
      >
        {merged.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={disabled || pending}>
        {pending ? "…" : "Save"}
      </Button>
    </form>
  );
}
