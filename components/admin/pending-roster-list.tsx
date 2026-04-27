"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveProfileAction,
  denyProfileAction,
} from "@/app/actions/profiles";
import type { Profile } from "@/lib/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PendingRosterList({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No pending registrations.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {profiles.map((p) => (
        <PendingRow key={p.id} profile={p} />
      ))}
    </div>
  );
}

function PendingRow({ profile }: { profile: Profile }) {
  const [approveState, approveAction, approving] = useActionState(
    approveProfileAction,
    null,
  );
  const [denyState, denyAction, denying] = useActionState(
    denyProfileAction,
    null,
  );

  useEffect(() => {
    if (approveState?.error) toast.error(approveState.error);
    if (approveState?.success) toast.success(approveState.success);
  }, [approveState]);

  useEffect(() => {
    if (denyState?.error) toast.error(denyState.error);
    if (denyState?.success) toast.success(denyState.success);
  }, [denyState]);

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold">
            {profile.first_name} {profile.last_name}
          </span>
          <span className="text-xs text-muted-foreground">{profile.email}</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          <Field label="Birthday" value={profile.birthday ?? "—"} />
          <Field label="Class year" value={profile.class_year ?? "—"} />
          <Field label="UIN" value={profile.uin ?? "—"} />
          <Field label="Submitted" value={formatDate(profile.created_at)} />
        </dl>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <form action={approveAction}>
          <input type="hidden" name="id" value={profile.id} />
          <Button type="submit" size="sm" disabled={approving || denying}>
            {approving ? "Approving…" : "Approve"}
          </Button>
        </form>
        <form
          action={denyAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `Deny ${profile.first_name} ${profile.last_name}? This deletes their account permanently.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={profile.id} />
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={approving || denying}
          >
            {denying ? "Denying…" : "Deny"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
