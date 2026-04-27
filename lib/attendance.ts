import type { AttendanceSemester } from "@/lib/content-types";

// Mirrors the SQL helpers in 0025_attendance.sql.
//   Jan–May → Spring · Jun–Jul → Summer · Aug–Dec → Fall
// Academic year wraps: Aug-Dec of year Y → "Y-(Y+1)"; Jan-Jul of Y → "(Y-1)-Y"
export function semesterFor(d: Date): AttendanceSemester {
  const m = d.getMonth() + 1;
  if (m >= 1 && m <= 5) return "Spring";
  if (m >= 6 && m <= 7) return "Summer";
  return "Fall";
}

export function academicYearFor(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function semesterAndYearFor(d: Date): {
  semester: AttendanceSemester;
  academic_year: string;
} {
  return { semester: semesterFor(d), academic_year: academicYearFor(d) };
}

// Parse a "YYYY-MM-DD" date string in local time so the user-picked date
// isn't shifted by UTC parsing.
export function parseLocalDate(yyyymmdd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export type ParsedRosterEntry = {
  athlete_name: string;
  uin_last4: string | null;
  is_restricted: boolean;
};

// Roster hint passed in by the page (athlete profiles) so the sportclubs
// camelCase splitter can disambiguate multi-word last names.
export type KnownAthlete = {
  first: string;
  last: string;
};

// Detect which format the officer pasted.
//   "sportclubs_table" — clean table paste from sportclubs.tamu.edu, one
//                        athlete per line with tab/space-separated cells
//                        and a trailing "Remove" cell
//   "sportclubs"       — single concatenated blob with "Remove" tokens
//                        between camelCase + digits chunks
//   "lines"            — original "Name (*****1234)" per-line format
function detectRosterFormat(
  input: string,
): "sportclubs_table" | "sportclubs" | "lines" {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 1) {
    let matchingTabular = 0;
    for (const l of lines) {
      const cells = l.includes("\t") ? l.split("\t") : l.split(/\s{2,}/);
      const trimmed = cells.map((c) => c.trim()).filter(Boolean);
      if (
        trimmed.length >= 3 &&
        /^remove$/i.test(trimmed[trimmed.length - 1])
      ) {
        matchingTabular++;
      }
    }
    if (matchingTabular > 0 && matchingTabular === lines.length) {
      return "sportclubs_table";
    }
  }
  if (/[A-Z][a-z]+[A-Z][A-Za-z]*\d{3,}Remove/.test(input)) {
    return "sportclubs";
  }
  return "lines";
}

// Try every camelCase split point; prefer one that matches the known
// roster (handles "MohAli" → "Moh-Ali" by stripping non-letters when the
// strict comparison fails). Falls back to splitting at the first
// uppercase letter.
function smartSplitCamelName(
  name: string,
  known: KnownAthlete[],
): { first: string; last: string } {
  const splitPoints: number[] = [];
  for (let i = 1; i < name.length; i++) {
    if (/[A-Z]/.test(name[i])) splitPoints.push(i);
  }
  if (splitPoints.length === 0) return { first: name, last: "" };

  if (known.length > 0) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    // Strict letter-equal match.
    for (const p of splitPoints) {
      const f = name.slice(0, p);
      const l = name.slice(p);
      const m = known.find(
        (k) =>
          k.first.toLowerCase() === f.toLowerCase() &&
          k.last.toLowerCase() === l.toLowerCase(),
      );
      if (m) return { first: m.first, last: m.last };
    }
    // Lenient match: ignore hyphens / spaces in the roster's last name.
    for (const p of splitPoints) {
      const f = norm(name.slice(0, p));
      const l = norm(name.slice(p));
      const m = known.find(
        (k) => norm(k.first) === f && norm(k.last) === l,
      );
      if (m) return { first: m.first, last: m.last };
    }
  }

  const p = splitPoints[0];
  return { first: name.slice(0, p), last: name.slice(p) };
}

// Tab-separated paste from sportclubs.tamu.edu's roster table. Each row:
//   "Alli\tPierce\t936006016\tRemove"
// We accept tabs (preferred) or 2+ spaces between cells to tolerate
// terminals/editors that converted tabs. The trailing "Remove" cell is
// dropped; the last remaining cell is the full UIN, of which we keep the
// last 4 digits.
function parseSportclubsTableRoster(input: string): ParsedRosterEntry[] {
  const out: ParsedRosterEntry[] = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") continue;
    const cells = line.includes("\t")
      ? line.split("\t")
      : line.split(/\s{2,}/);
    const trimmed = cells.map((c) => c.trim()).filter(Boolean);
    while (
      trimmed.length > 0 &&
      /^remove$/i.test(trimmed[trimmed.length - 1])
    ) {
      trimmed.pop();
    }
    if (trimmed.length < 3) continue;
    const first = trimmed[0];
    const last = trimmed[1];
    const uinCell = trimmed[trimmed.length - 1];
    const digits = uinCell.replace(/\D/g, "");
    if (digits.length < 4) continue;
    out.push({
      athlete_name: `${first} ${last}`.trim(),
      uin_last4: digits.slice(-4),
      is_restricted: false,
    });
  }
  return out;
}

// sportclubs.tamu.edu copy-paste:
//   "AbigailBernero935001382RemoveAdamPicco435000360Remove..."
// Each chunk between "Remove" tokens is letters + digits. The trailing
// 9 digits are the UIN; we keep the last 4. The format carries no
// restricted flag, so officers must edit that in the preview table.
function parseSportclubsRoster(
  input: string,
  known: KnownAthlete[],
): ParsedRosterEntry[] {
  const out: ParsedRosterEntry[] = [];
  const chunks = input
    .split(/Remove/g)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    const m = /^([A-Za-z]+)(\d+)$/.exec(chunk);
    if (!m) continue;
    const namePart = m[1];
    const digitsPart = m[2];
    if (digitsPart.length < 4) continue;
    const uin_last4 = digitsPart.slice(-4);
    const { first, last } = smartSplitCamelName(namePart, known);
    const fullName = last ? `${first} ${last}` : first;
    out.push({ athlete_name: fullName.trim(), uin_last4, is_restricted: false });
  }
  return out;
}

// Original line-based format:
//   "Aarna Shukla (*****4398)"
//   "Sofia Rodriguez (*****3901) (Restricted)"
//   "John Doe"                          (no UIN — still accepted)
function parseLineRoster(input: string): ParsedRosterEntry[] {
  const out: ParsedRosterEntry[] = [];
  const lines = input.split(/\r?\n/);
  const restrictedRe = /\(restricted\)\s*$/i;
  const uinRe = /\(\*+(\d{2,4})\)\s*$/;
  for (const raw of lines) {
    let line = raw.trim();
    if (line === "") continue;
    let is_restricted = false;
    const restrictedMatch = line.match(restrictedRe);
    if (restrictedMatch) {
      is_restricted = true;
      line = line.slice(0, line.length - restrictedMatch[0].length).trim();
    }
    let uin_last4: string | null = null;
    const uinMatch = line.match(uinRe);
    if (uinMatch) {
      const digits = uinMatch[1];
      uin_last4 =
        digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, "0");
      line = line.slice(0, line.length - uinMatch[0].length).trim();
    }
    if (line === "") continue;
    out.push({ athlete_name: line, uin_last4, is_restricted });
  }
  return out;
}

// Auto-detects the format. Pass a roster of known athletes (first/last
// pairs) to help the concatenated sportclubs splitter handle multi-word
// last names; the tabular sportclubs format already has cells, so it
// doesn't need the roster hint.
export function parseRoster(
  input: string,
  knownAthletes: KnownAthlete[] = [],
): ParsedRosterEntry[] {
  switch (detectRosterFormat(input)) {
    case "sportclubs_table":
      return parseSportclubsTableRoster(input);
    case "sportclubs":
      return parseSportclubsRoster(input, knownAthletes);
    default:
      return parseLineRoster(input);
  }
}

// Build an academic-year picker covering the last few years and the next
// one, anchored to the current date. Useful for filter dropdowns.
export function recentAcademicYears(span = 4): string[] {
  const now = new Date();
  const current = academicYearFor(now);
  const startYear = Number(current.split("-")[0]);
  const out: string[] = [];
  for (let i = -1; i < span; i++) {
    const y = startYear - i;
    out.push(`${y}-${y + 1}`);
  }
  return out;
}
