"use client";

import { Button } from "@/components/ui/button";

export function ResponsesCsvButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: string[][];
}) {
  function download() {
    const all = [headers, ...rows];
    const csv = all.map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button onClick={download} variant="outline" disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}

function escape(cell: string): string {
  // RFC 4180-ish: wrap in quotes if needed, double internal quotes.
  if (/[",\r\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}
