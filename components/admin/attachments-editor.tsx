"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import type { MeetAttachment } from "@/lib/content-types";

export function AttachmentsEditor({
  initial = [],
  name = "attachments_urls",
}: {
  initial?: MeetAttachment[];
  name?: string;
}) {
  const [items, setItems] = useState<MeetAttachment[]>(
    initial.length > 0 ? initial : [{ name: "", url: "" }],
  );

  // Re-sync when the parent feeds new data (e.g. switching to a new edit form).
  useEffect(() => {
    setItems(
      initial.length > 0 ? initial : [{ name: "", url: "" }],
    );
    // Cheap dep: changes if the attachment set changes.
  }, [JSON.stringify(initial)]);

  const serialized = useMemo(
    () =>
      JSON.stringify(
        items
          .map((i) => ({ name: i.name.trim(), url: i.url.trim() }))
          .filter((i) => i.name && i.url),
      ),
    [items],
  );

  function update(i: number, patch: Partial<MeetAttachment>) {
    setItems((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  }
  function remove(i: number) {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length === 0 ? [{ name: "", url: "" }] : next;
    });
  }
  function add() {
    setItems((prev) => [...prev, { name: "", url: "" }]);
  }
  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={serialized} />
      {items.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-2 rounded-md border bg-card p-3 sm:grid-cols-[1fr_2fr_auto]"
        >
          <div className="grid gap-1">
            <Label htmlFor={`att-name-${i}`} className="text-xs">
              Label
            </Label>
            <Input
              id={`att-name-${i}`}
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Heat sheet"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`att-url-${i}`} className="text-xs">
              URL
            </Label>
            <Input
              id={`att-url-${i}`}
              type="url"
              value={row.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://drive.google.com/…"
            />
          </div>
          <div className="flex items-end gap-1 sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Move up"
              onClick={() => move(i, -1)}
              disabled={i === 0}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Move down"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label="Remove attachment"
              onClick={() => remove(i)}
              disabled={
                items.length === 1 &&
                row.name.trim() === "" &&
                row.url.trim() === ""
              }
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 size-3.5" /> Add attachment
        </Button>
      </div>
    </div>
  );
}
