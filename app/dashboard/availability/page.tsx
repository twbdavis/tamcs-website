import Link from "next/link";
import { requireMinRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityForm } from "@/components/admin/availability-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteAvailabilityAction } from "@/app/actions/availability";
import {
  AVAILABILITY_DAYS,
  DAY_LABEL,
  SLOTS_PER_DAY,
  buildHeatmap,
  formatTime,
  heatClass,
  slotIndexToLabel,
} from "@/lib/availability";
import type { AvailabilityBlock } from "@/lib/content-types";

export const metadata = { title: "Availability" };

type ProfileLite = { id: string; full_name: string | null; email: string };

export default async function AvailabilityPage() {
  const { user } = await requireMinRole("officer");
  const supabase = await createClient();

  const { data: blocks } = await supabase
    .from("availability")
    .select("*")
    .order("day_of_week")
    .order("start_time")
    .returns<AvailabilityBlock[]>();

  const all = blocks ?? [];
  const mine = all.filter((b) => b.user_id === user.id);

  const userIds = Array.from(new Set(all.map((b) => b.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
        .returns<ProfileLite[]>()
    : { data: [] as ProfileLite[] };

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameById.set(p.id, p.full_name ?? p.email);
  }

  const heatmap = buildHeatmap(all);
  const totalUsers = userIds.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Officer availability</h1>
      <p className="mt-1 text-muted-foreground">
        Add your weekly free blocks. The grid below shows everyone&apos;s
        overlap so we can find good meeting windows.
      </p>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add a block</h2>
        <AvailabilityForm />

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My blocks
          </h3>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t added any availability yet.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {mine.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium capitalize">
                      {b.day_of_week}
                    </span>{" "}
                    · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </span>
                  <DeleteButton
                    action={deleteAvailabilityAction}
                    id={b.id}
                    confirmMessage="Remove this availability block?"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Everyone&apos;s overlap</h2>
          <span className="text-xs text-muted-foreground">
            {totalUsers} officer{totalUsers === 1 ? "" : "s"} have submitted
          </span>
        </div>

        <Legend />

        {totalUsers === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No availability submitted yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/40 px-2 py-1 text-left font-medium">
                    Time
                  </th>
                  {AVAILABILITY_DAYS.map((d) => (
                    <th
                      key={d}
                      className="px-2 py-1 text-center font-medium uppercase"
                    >
                      {DAY_LABEL[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: SLOTS_PER_DAY }).map((_, i) => (
                  <tr key={i}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-background px-2 py-0.5 text-muted-foreground">
                      {i % 2 === 0 ? slotIndexToLabel(i) : ""}
                    </td>
                    {AVAILABILITY_DAYS.map((d) => {
                      const cell = heatmap[d][i];
                      const cls = heatClass(cell.count, totalUsers);
                      const tooltip = cell.userIds
                        .map((id) => nameById.get(id) ?? "Someone")
                        .join(", ");
                      return (
                        <td
                          key={d}
                          title={
                            cell.count
                              ? `${cell.count}/${totalUsers} · ${tooltip}`
                              : "No one available"
                          }
                          className={`h-6 border-l border-background/40 ${cls}`}
                        >
                          <span className="sr-only">
                            {cell.count} of {totalUsers} available
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Legend() {
  const items = [
    { cls: "bg-muted/40", label: "Nobody" },
    { cls: "bg-red-300", label: "Few" },
    { cls: "bg-yellow-300", label: "Some" },
    { cls: "bg-green-400", label: "Most" },
    { cls: "bg-green-600", label: "Everyone" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-5 rounded ${i.cls}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
