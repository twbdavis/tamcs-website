// ingest-attendance
// Public webhook for the Attendance Tracker. External callers (Google
// Apps Script, Claude-in-Chrome automation, sportclubs.tamu.edu scrapers,
// etc.) POST a parsed roll-call here as JSON; we authenticate with the
// shared `secret` field and insert one attendance_session + N
// attendance_records using the service-role key.
//
// JWT verification is disabled for this function in supabase/config.toml.
//
// Required env vars (configure in Supabase project settings):
//   INGEST_EMAIL_SECRET        — shared secret reused for all ingest webhooks
//   SUPABASE_URL               — auto-injected by the Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY  — auto-injected; bypasses RLS

import { createClient } from "jsr:@supabase/supabase-js@2";

type Participant = {
  name?: unknown;
  uin_last4?: unknown;
  is_restricted?: unknown;
};

type Payload = {
  date?: unknown;
  title?: unknown;
  participants?: unknown;
  secret?: unknown;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

// 30-second budget for any single DB operation.
const DB_TIMEOUT_MS = 30_000;

// Short request id for correlating logs across one POST.
function requestId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

function errorResponse(
  rid: string,
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
): Response {
  console.error(`[${rid}] ${status} ${message}`, extra);
  return jsonResponse({ ok: false, error: message, ...extra }, status);
}

async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Mirrors lib/attendance.ts and the SQL helpers in 0025_attendance.sql.
function semesterFor(d: Date): "Fall" | "Spring" | "Summer" {
  const m = d.getMonth() + 1;
  if (m >= 1 && m <= 5) return "Spring";
  if (m >= 6 && m <= 7) return "Summer";
  return "Fall";
}

function academicYearFor(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

type CleanRecord = {
  athlete_name: string;
  uin_last4: string | null;
  is_restricted: boolean;
};

// Coerce a raw participant entry into the row shape we'll insert. Returns
// null if the entry has no usable name. Both string and integer UINs are
// accepted; anything else is dropped to null.
function cleanParticipant(p: Participant): CleanRecord | null {
  if (!p || typeof p !== "object") return null;
  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (name === "") return null;
  let uin_last4: string | null = null;
  if (typeof p.uin_last4 === "string" && /^\d{4}$/.test(p.uin_last4.trim())) {
    uin_last4 = p.uin_last4.trim();
  } else if (
    typeof p.uin_last4 === "number" &&
    Number.isInteger(p.uin_last4) &&
    p.uin_last4 >= 0 &&
    p.uin_last4 <= 9999
  ) {
    uin_last4 = String(p.uin_last4).padStart(4, "0");
  } else if (typeof p.uin_last4 === "string") {
    // Accept full UINs or anything with digits and trim to last 4.
    const digits = p.uin_last4.replace(/\D/g, "");
    if (digits.length >= 4) uin_last4 = digits.slice(-4);
  }
  return {
    athlete_name: name,
    uin_last4,
    is_restricted: p.is_restricted === true,
  };
}

function dedupeKey(r: { athlete_name: string; uin_last4: string | null }) {
  return `${r.athlete_name.toLowerCase()}|${r.uin_last4 ?? ""}`;
}

Deno.serve(async (req) => {
  const rid = requestId();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return errorResponse(rid, "Method not allowed", 405);
  }

  // Read the raw body so we can log exactly what arrived if parsing fails.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    return errorResponse(rid, "Failed to read request body", 400, {
      detail: (e as Error).message,
    });
  }
  console.log(
    `[${rid}] POST /ingest-attendance ` +
      `content-type=${req.headers.get("content-type") ?? ""} ` +
      `length=${rawBody.length}`,
  );
  if (rawBody.length === 0) {
    return errorResponse(rid, "Empty request body", 400);
  }

  let parsed: Payload;
  try {
    parsed = JSON.parse(rawBody) as Payload;
  } catch (e) {
    console.error(`[${rid}] Invalid JSON. First 500 chars:`, rawBody.slice(0, 500));
    return errorResponse(rid, "Invalid JSON", 400, {
      detail: (e as Error).message,
    });
  }
  console.log(
    `[${rid}] body keys=${Object.keys(parsed).join(",")} ` +
      `participantsType=${
        Array.isArray(parsed.participants)
          ? `array(${parsed.participants.length})`
          : typeof parsed.participants
      }`,
  );

  const expected = Deno.env.get("INGEST_EMAIL_SECRET");
  if (!expected) {
    return errorResponse(rid, "Server is not configured", 500);
  }
  if (typeof parsed.secret !== "string" || parsed.secret !== expected) {
    return errorResponse(rid, "Unauthorized", 401);
  }

  const dateStr = typeof parsed.date === "string" ? parsed.date.trim() : "";
  const dt = parseLocalDate(dateStr);
  if (!dt) {
    return errorResponse(rid, "date must be YYYY-MM-DD", 400, {
      received_date: parsed.date,
    });
  }

  const title =
    typeof parsed.title === "string" && parsed.title.trim() !== ""
      ? parsed.title.trim()
      : "Practice";

  if (parsed.participants == null) {
    return errorResponse(rid, "participants is required", 400);
  }
  if (!Array.isArray(parsed.participants)) {
    return errorResponse(rid, "participants must be an array", 400, {
      received_type: typeof parsed.participants,
    });
  }
  if (parsed.participants.length === 0) {
    return errorResponse(rid, "No valid participants provided", 400, {
      received_count: 0,
    });
  }

  const cleaned: CleanRecord[] = [];
  let invalid = 0;
  for (const p of parsed.participants as Participant[]) {
    const c = cleanParticipant(p);
    if (c) cleaned.push(c);
    else invalid++;
  }
  console.log(
    `[${rid}] participants received=${parsed.participants.length} ` +
      `valid=${cleaned.length} invalid=${invalid} ` +
      `sample=${cleaned
        .slice(0, 3)
        .map((c) => c.athlete_name)
        .join(" | ")}`,
  );

  if (cleaned.length === 0) {
    return errorResponse(rid, "No valid participants provided", 400, {
      received_count: parsed.participants.length,
      invalid_count: invalid,
    });
  }

  const semester = semesterFor(dt);
  const academic_year = academicYearFor(dt);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Upsert behavior: if a session with the same (date, title) already
  // exists, reuse it and append only records that aren't already there.
  let sessionId: string;
  let sessionExisted = false;
  try {
    const lookup = await withTimeout(
      supabase
        .from("attendance_sessions")
        .select("id")
        .eq("session_date", dateStr)
        .eq("title", title)
        .maybeSingle(),
      DB_TIMEOUT_MS,
      "session lookup",
    );
    if (lookup.error) {
      return errorResponse(rid, lookup.error.message, 500, {
        stage: "session-lookup",
      });
    }
    if (lookup.data) {
      sessionId = lookup.data.id as string;
      sessionExisted = true;
      console.log(
        `[${rid}] reusing existing session id=${sessionId} ${dateStr} "${title}"`,
      );
    } else {
      const created = await withTimeout(
        supabase
          .from("attendance_sessions")
          .insert({
            session_date: dateStr,
            title,
            semester,
            academic_year,
          })
          .select("id")
          .single(),
        DB_TIMEOUT_MS,
        "session insert",
      );
      if (created.error || !created.data) {
        return errorResponse(
          rid,
          created.error?.message ?? "Failed to create session",
          500,
          { stage: "session-insert" },
        );
      }
      sessionId = created.data.id as string;
      console.log(
        `[${rid}] created new session id=${sessionId} ${dateStr} "${title}"`,
      );
    }
  } catch (e) {
    return errorResponse(rid, (e as Error).message, 500, {
      stage: "session-resolve",
    });
  }

  // De-dupe against existing records on the session so re-runs don't
  // create duplicate rows for the same person.
  let toInsert = cleaned;
  if (sessionExisted) {
    try {
      const existing = await withTimeout(
        supabase
          .from("attendance_records")
          .select("athlete_name, uin_last4")
          .eq("session_id", sessionId),
        DB_TIMEOUT_MS,
        "existing records lookup",
      );
      if (existing.error) {
        return errorResponse(rid, existing.error.message, 500, {
          stage: "records-lookup",
        });
      }
      const seen = new Set<string>(
        (existing.data ?? []).map((r) =>
          dedupeKey({
            athlete_name: String(r.athlete_name ?? ""),
            uin_last4:
              r.uin_last4 == null ? null : String(r.uin_last4),
          }),
        ),
      );
      toInsert = cleaned.filter((r) => !seen.has(dedupeKey(r)));
      console.log(
        `[${rid}] dedupe: existing=${existing.data?.length ?? 0} ` +
          `incoming=${cleaned.length} new=${toInsert.length}`,
      );
    } catch (e) {
      return errorResponse(rid, (e as Error).message, 500, {
        stage: "records-dedupe",
      });
    }
  }

  let inserted = 0;
  if (toInsert.length > 0) {
    // Chunk so a single huge POST doesn't bump into PostgREST limits.
    const CHUNK = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const rows = slice.map((r) => ({ ...r, session_id: sessionId }));
      try {
        const result = await withTimeout(
          supabase.from("attendance_records").insert(rows),
          DB_TIMEOUT_MS,
          `records insert ${i}-${i + slice.length}`,
        );
        if (result.error) {
          // If this is a brand-new session and the very first chunk
          // failed, roll the empty session back so we don't litter the
          // history with empties.
          if (!sessionExisted && inserted === 0) {
            await supabase
              .from("attendance_sessions")
              .delete()
              .eq("id", sessionId);
          }
          return errorResponse(rid, result.error.message, 500, {
            stage: "records-insert",
            session_id: sessionId,
            inserted_so_far: inserted,
          });
        }
        inserted += slice.length;
      } catch (e) {
        return errorResponse(rid, (e as Error).message, 500, {
          stage: "records-insert",
          session_id: sessionId,
          inserted_so_far: inserted,
        });
      }
    }
  }

  console.log(
    `[${rid}] done session_id=${sessionId} inserted=${inserted} ` +
      `received=${parsed.participants.length} valid=${cleaned.length} ` +
      `duplicates=${cleaned.length - toInsert.length} invalid=${invalid}`,
  );

  return jsonResponse(
    {
      ok: true,
      request_id: rid,
      session_id: sessionId,
      session_existed: sessionExisted,
      session_date: dateStr,
      title,
      semester,
      academic_year,
      received: parsed.participants.length,
      valid: cleaned.length,
      invalid,
      duplicates: cleaned.length - toInsert.length,
      inserted,
    },
    200,
  );
});
