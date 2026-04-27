"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateUserRoleAction,
    null,
  );

  // Controlled select. Initialize from prop, then keep it in sync if the
  // server data refreshes (e.g. after router.refresh() following success,
  // or if another tab changed the role).
  const [role, setRole] = useState<UserRole>(currentRole);
  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      // Revert visible selection to whatever the server still has.
      setRole(currentRole);
    } else if (state?.success) {
      toast.success(state.success);
      // Pull the freshest server state so the rest of the row (and
      // currentRole prop) reflects the new value.
      router.refresh();
    }
  }, [state, currentRole, router]);

  // Make sure the user's current role is selectable, even if it's outside the
  // caller's normal assignable set (e.g. an admin viewing a president).
  const merged = options.includes(currentRole)
    ? options
    : [currentRole, ...options];

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        disabled={disabled || pending}
        className={SELECT_CLASS}
      >
        {merged.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || pending || role === currentRole}
      >
        {pending ? "…" : "Save"}
      </Button>
    </form>
  );
}
