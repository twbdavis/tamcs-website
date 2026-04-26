import type {
  CoachingScheduleEntry,
  CoachingScheduleType,
  DayOfWeek,
} from "@/lib/content-types";

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const TYPE_LABELS: Record<CoachingScheduleType, string> = {
  practice: "Practice",
  dryland: "Dryland",
  meeting: "Meeting",
  social: "Social",
};

// Mon–Sun ordering for week views.
export const WEEK_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatTime(t: string): string {
  // "HH:MM" or "HH:MM:SS" → "h:mm AM/PM"
  const [hh, mm] = t.split(":");
  const h = Number(hh);
  const minute = mm ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return minute === "00"
    ? `${hour12} ${period}`
    : `${hour12}:${minute} ${period}`;
}

export function groupByDay(entries: CoachingScheduleEntry[]) {
  const recurring = entries.filter((e) => e.recurring && e.day_of_week !== null);
  const byDay = new Map<DayOfWeek, CoachingScheduleEntry[]>();
  for (const day of WEEK_ORDER) byDay.set(day, []);
  for (const entry of recurring) {
    const day = entry.day_of_week as DayOfWeek;
    byDay.get(day)!.push(entry);
  }
  for (const [, list] of byDay) {
    list.sort((a, b) => {
      if (a.display_order !== b.display_order)
        return a.display_order - b.display_order;
      return a.start_time.localeCompare(b.start_time);
    });
  }
  return byDay;
}

export function upcomingOneOffs(
  entries: CoachingScheduleEntry[],
  today = new Date(),
): CoachingScheduleEntry[] {
  const todayKey = isoDate(today);
  return entries
    .filter((e) => !e.recurring && e.specific_date && e.specific_date >= todayKey)
    .sort((a, b) => {
      const d = (a.specific_date ?? "").localeCompare(b.specific_date ?? "");
      return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
    });
}

function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatSpecificDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  if (!y || !m || !d) return yyyymmdd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── month expansion ─────────────────────────────────────────────────────────
// Turn the coaching_schedule rows (recurring + one-offs) into a map keyed by
// "YYYY-MM-DD" for a given calendar month, respecting effective_from /
// effective_to on recurring entries.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildMonthOccurrences(
  entries: CoachingScheduleEntry[],
  year: number,
  monthIndex0: number,
): Map<string, CoachingScheduleEntry[]> {
  const out = new Map<string, CoachingScheduleEntry[]>();
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, monthIndex0, day);
    const key = dateKey(date);
    const dow = date.getDay() as DayOfWeek;
    const matches: CoachingScheduleEntry[] = [];

    for (const e of entries) {
      if (e.recurring) {
        if (e.day_of_week !== dow) continue;
        if (e.effective_from && key < e.effective_from) continue;
        if (e.effective_to && key > e.effective_to) continue;
        matches.push(e);
      } else if (e.specific_date === key) {
        matches.push(e);
      }
    }

    matches.sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (matches.length > 0) out.set(key, matches);
  }

  return out;
}

// Calendar grid cells, Sunday-first. Each row is a week; cells outside the
// current month are flagged so the calendar component can dim them.
export type CalendarCell = {
  date: Date;
  key: string;
  inMonth: boolean;
};

export function buildMonthGrid(
  year: number,
  monthIndex0: number,
): CalendarCell[][] {
  const first = new Date(year, monthIndex0, 1);
  const startOffset = first.getDay(); // 0 = Sun
  const start = new Date(year, monthIndex0, 1 - startOffset);

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      row.push({
        date,
        key: dateKey(date),
        inMonth: date.getMonth() === monthIndex0,
      });
    }
    weeks.push(row);
    // Stop early if we've already passed the month and the row was
    // entirely "outside".
    const last = row[6];
    if (last.date.getMonth() !== monthIndex0 && last.date > first && w >= 4) {
      // keep going; covers months that need 6 weeks
    }
  }
  return weeks;
}

export function parseMonthParam(
  raw: string | undefined,
  fallback = new Date(),
): { year: number; monthIndex0: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (y && m && m >= 1 && m <= 12) {
      return { year: y, monthIndex0: m - 1 };
    }
  }
  return { year: fallback.getFullYear(), monthIndex0: fallback.getMonth() };
}

export function shiftMonth(
  year: number,
  monthIndex0: number,
  delta: number,
): { year: number; monthIndex0: number } {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

export function monthLabel(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function monthParam(year: number, monthIndex0: number): string {
  return `${year}-${pad(monthIndex0 + 1)}`;
}
