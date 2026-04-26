import type { AvailabilityBlock, AvailabilityDay } from "@/lib/content-types";

export const AVAILABILITY_DAYS: AvailabilityDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABEL: Record<AvailabilityDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// 30-minute resolution from 7am to 10pm — enough range for most meetings,
// keeps the grid scannable.
export const SLOT_MINUTES = 30;
export const FIRST_HOUR = 7;
export const LAST_HOUR = 22; // exclusive
export const SLOTS_PER_DAY = ((LAST_HOUR - FIRST_HOUR) * 60) / SLOT_MINUTES;

export function slotIndexToLabel(i: number): string {
  const total = FIRST_HOUR * 60 + i * SLOT_MINUTES;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function timeToSlot(t: string): number {
  // "HH:MM" or "HH:MM:SS" → integer slot index from FIRST_HOUR.
  const [hh, mm] = t.split(":");
  const total = Number(hh) * 60 + Number(mm);
  return Math.round((total - FIRST_HOUR * 60) / SLOT_MINUTES);
}

export function formatTime(t: string): string {
  const [hh, mm] = t.split(":");
  const h = Number(hh);
  const minute = mm ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return minute === "00"
    ? `${hour12} ${period}`
    : `${hour12}:${minute.slice(0, 2)} ${period}`;
}

export type HeatCell = {
  count: number;
  userIds: string[];
};

export function buildHeatmap(blocks: AvailabilityBlock[]) {
  const grid: Record<AvailabilityDay, HeatCell[]> = {
    monday: emptyDay(),
    tuesday: emptyDay(),
    wednesday: emptyDay(),
    thursday: emptyDay(),
    friday: emptyDay(),
    saturday: emptyDay(),
    sunday: emptyDay(),
  };

  for (const b of blocks) {
    const startSlot = Math.max(0, timeToSlot(b.start_time));
    const endSlot = Math.min(SLOTS_PER_DAY, timeToSlot(b.end_time));
    for (let s = startSlot; s < endSlot; s++) {
      const cell = grid[b.day_of_week][s];
      if (!cell.userIds.includes(b.user_id)) {
        cell.userIds.push(b.user_id);
        cell.count = cell.userIds.length;
      }
    }
  }

  return grid;
}

function emptyDay(): HeatCell[] {
  return Array.from({ length: SLOTS_PER_DAY }, () => ({ count: 0, userIds: [] }));
}

// Map (count / total) to a tailwind-ish color class. Buckets: 0, low, mid, high.
export function heatClass(count: number, total: number): string {
  if (count === 0 || total === 0) return "bg-muted/40";
  const ratio = count / total;
  if (ratio >= 0.85) return "bg-green-600 text-white";
  if (ratio >= 0.6) return "bg-green-400";
  if (ratio >= 0.35) return "bg-yellow-300";
  return "bg-red-300";
}
