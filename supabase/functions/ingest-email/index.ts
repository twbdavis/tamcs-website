// ingest-email
// Public webhook for the Weekly Announcements feature. External callers
// (Google Apps Script, Postmark/SendGrid/etc., Cloudflare Email Workers)
// POST the parsed message here as JSON; we authenticate with the
// `secret` field in the body (a Supabase JWT cannot be sent by Apps
// Script) and insert into weekly_announcements with the service-role key.
//
// JWT verification is disabled for this function in supabase/config.toml.
//
// Required env vars (configure in Supabase project settings):
//   INGEST_EMAIL_SECRET        — shared secret the caller must send
//   SUPABASE_URL               — auto-injected by the Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY  — auto-injected; bypasses RLS

import { createClient } from "jsr:@supabase/supabase-js@2";

type Payload = {
  subject?: unknown;
  body?: unknown;
  sender?: unknown;
  secret?: unknown;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, "content-type": "text/plain" },
  });
}

function stripHtml(input: string): string {
  return input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(?=\s|$)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeHtml(input: string): boolean {
  return /<[a-z][\s\S]*>/i.test(input);
}

Deno.serve(async (req) => {
  // CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return textResponse("Method not allowed", 405);
  }

  let parsed: Payload;
  try {
    parsed = await req.json();
  } catch {
    return textResponse("Invalid JSON", 400);
  }

  const expected = Deno.env.get("INGEST_EMAIL_SECRET");
  if (!expected) {
    return textResponse("Server is not configured", 500);
  }
  if (typeof parsed.secret !== "string" || parsed.secret !== expected) {
    return textResponse("Unauthorized", 401);
  }

  const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
  const rawBody = typeof parsed.body === "string" ? parsed.body : "";
  const sender = typeof parsed.sender === "string" ? parsed.sender.trim() : "";

  if (!subject || !rawBody.trim()) {
    return textResponse("Missing subject or body", 400);
  }

  const isHtml = looksLikeHtml(rawBody);
  const body = isHtml ? stripHtml(rawBody) : rawBody.trim();
  const bodyHtml = isHtml ? rawBody : null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await supabase.from("weekly_announcements").insert({
    subject,
    body,
    body_html: bodyHtml,
    sender: sender === "" ? null : sender,
  });

  if (error) {
    return textResponse(error.message, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
