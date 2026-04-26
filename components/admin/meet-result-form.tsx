"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertMeetResultAction } from "@/app/actions/meet-results";
import { compareEvents } from "@/lib/swim-events";
import type { MeetResult, MeetResultEntry } from "@/lib/content-types";

const SAMPLE_JSON = `[
  { "event": "100 Free", "swimmer": "Jane Doe", "time": "55.21" },
  { "event": "100 Free", "swimmer": "John Smith", "time": "57.04" },
  { "event": "200 IM", "swimmer": "Jane Doe", "time": "2:14.30" }
]`;

type ParseState =
  | { ok: true; entries: MeetResultEntry[] }
  | { ok: false; error: string };

function parseEntries(raw: string): ParseState {
  if (!raw.trim()) return { ok: true, entries: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Not valid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Expected a JSON array of entries" };
  }
  const out: MeetResultEntry[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const r = parsed[i] as Record<string, unknown>;
    const event = typeof r?.event === "string" ? r.event.trim() : "";
    const swimmer = typeof r?.swimmer === "string" ? r.swimmer.trim() : "";
    const time = typeof r?.time === "string" ? r.time.trim() : "";
    if (!event || !swimmer || !time) {
      return {
        ok: false,
        error: `Entry #${i + 1} is missing event, swimmer, or time`,
      };
    }
    out.push({ event, swimmer, time });
  }
  return { ok: true, entries: out };
}

function groupByEvent(entries: MeetResultEntry[]) {
  const map = new Map<string, MeetResultEntry[]>();
  for (const e of entries) {
    const list = map.get(e.event) ?? [];
    list.push(e);
    map.set(e.event, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => compareTimes(a.time, b.time));
  }
  // Re-key in canonical event order so iteration matches the public page.
  const sorted = new Map<string, MeetResultEntry[]>();
  for (const k of [...map.keys()].sort(compareEvents)) {
    sorted.set(k, map.get(k)!);
  }
  return sorted;
}

// "55.21" / "1:23.45" → seconds. Falls back to string compare on bad input.
function compareTimes(a: string, b: string): number {
  const av = toSeconds(a);
  const bv = toSeconds(b);
  if (av === null || bv === null) return a.localeCompare(b);
  return av - bv;
}
function toSeconds(t: string): number | null {
  const m = t.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const min = m[1] ? Number(m[1]) : 0;
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min * 60 + sec;
}

export function MeetResultForm({
  meet,
  redirectAfterSave,
}: {
  meet?: MeetResult;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertMeetResultAction,
    null,
  );

  const initialJson =
    meet?.results !== undefined
      ? JSON.stringify(stripPlace(meet.results), null, 2)
      : SAMPLE_JSON;
  const [resultsText, setResultsText] = useState<string>(initialJson);

  const parsed = useMemo(() => parseEntries(resultsText), [resultsText]);
  const grouped = useMemo<Map<string, MeetResultEntry[]>>(
    () => (parsed.ok ? groupByEvent(parsed.entries) : new Map()),
    [parsed],
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) router.push(redirectAfterSave);
      else if (!meet) {
        formRef.current?.reset();
        setResultsText(SAMPLE_JSON);
      }
    }
  }, [state, meet, redirectAfterSave, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {meet ? <input type="hidden" name="id" value={meet.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="meet_name">Meet name</Label>
          <Input
            id="meet_name"
            name="meet_name"
            defaultValue={meet?.meet_name ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={meet?.date ?? ""}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <div className="grid gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={meet?.location ?? ""}
            placeholder="Texas State University, San Marcos, TX"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="overall_place">Overall place</Label>
          <Input
            id="overall_place"
            name="overall_place"
            type="number"
            min={1}
            defaultValue={meet?.overall_place ?? ""}
            placeholder="3"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="results">Results (JSON)</Label>
        <textarea
          id="results"
          name="results"
          value={resultsText}
          onChange={(e) => setResultsText(e.target.value)}
          rows={10}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          Array of <code>{"{ event, swimmer, time }"}</code> objects.
          Per-swimmer place is no longer used — set the team&apos;s overall
          finish in <em>Overall place</em> above.
        </p>
      </div>

      <section className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Preview (grouped by event)</h3>
        {!parsed.ok ? (
          <p className="mt-2 text-sm text-red-600">{parsed.error}</p>
        ) : parsed.entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Paste results above to preview.
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {[...grouped.entries()].map(([event, list]) => (
              <div key={event} className="rounded-md border bg-card p-3">
                <h4 className="text-sm font-semibold">{event}</h4>
                <ul className="mt-1 grid gap-1 text-sm">
                  {list.map((e, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-4 border-b py-1 last:border-none"
                    >
                      <span>{e.swimmer}</span>
                      <span className="font-mono text-muted-foreground">
                        {e.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={meet?.notes ?? ""}
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !parsed.ok}>
          {pending ? "Saving…" : meet ? "Save changes" : "Add meet"}
        </Button>
      </div>
    </form>
  );
}

// Older meet rows may have a per-swimmer `place` field; strip it on edit.
function stripPlace(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((r) => {
    if (r && typeof r === "object") {
      const { place: _drop, ...rest } = r as Record<string, unknown>;
      void _drop;
      return rest;
    }
    return r;
  });
}
