"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SetView } from "@/components/workouts/set-view";
import {
  WORKOUT_SECTION_LABELS,
  type WorkoutSectionType,
  type WorkoutSetWithSections,
} from "@/lib/content-types";

const SECTION_TYPES: WorkoutSectionType[] = [
  "warmup",
  "preset",
  "kick",
  "pull",
  "main",
  "sprint",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BankList({ sets }: { sets: WorkoutSetWithSections[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | WorkoutSectionType>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q)) return false;
      if (filter !== "all") {
        const has = s.sections.some((sec) => sec.section_type === filter);
        if (!has) return false;
      }
      return true;
    });
  }, [sets, query, filter]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="bank-search">Search by title</Label>
          <Input
            id="bank-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="distance, sprint, IM…"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bank-filter">Section type</Label>
          <select
            id="bank-filter"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | WorkoutSectionType)
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">All types</option>
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {WORKOUT_SECTION_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No matching sets.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => {
            const total = s.sections.reduce(
              (sum, sec) => sum + (sec.total_yardage ?? 0),
              0,
            );
            const types = Array.from(
              new Set(s.sections.map((sec) => sec.section_type)),
            );
            return (
              <details
                key={s.id}
                className="group rounded-lg border bg-card shadow-sm"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(s.created_at)} · {total.toLocaleString()} yd
                      total
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {WORKOUT_SECTION_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="text-xs text-muted-foreground transition-transform group-open:rotate-90"
                  >
                    ▶
                  </span>
                </summary>
                <div className="border-t p-5">
                  <SetView sections={s.sections} />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
