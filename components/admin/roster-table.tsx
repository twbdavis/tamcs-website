"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { RoleSelect } from "@/components/admin/role-select";
import type { Profile, UserRole } from "@/lib/types";

type Column = {
  key: keyof RowShape;
  label: string;
  sortable?: boolean;
};

type RowShape = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birthday: string;
  class_year: string;
  uin: string;
  phone: string;
  role: UserRole;
  joined: string;
};

const COLUMNS: Column[] = [
  { key: "first_name", label: "First Name", sortable: true },
  { key: "last_name", label: "Last Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "phone", label: "Phone", sortable: true },
  { key: "birthday", label: "Birthday", sortable: true },
  { key: "class_year", label: "Class Year", sortable: true },
  { key: "uin", label: "UIN", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "joined", label: "Date Joined", sortable: true },
];

function toRow(p: Profile): RowShape {
  return {
    id: p.id,
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    email: p.email ?? "",
    birthday: p.birthday ?? "",
    class_year: p.class_year ?? "",
    uin: p.uin ?? "",
    phone: p.phone_number ?? "",
    role: p.role,
    joined: p.created_at ?? "",
  };
}

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(rows: RowShape[]) {
  const headers = COLUMNS.map((c) => c.label);
  const lines = [headers, ...rows.map((r) => COLUMNS.map((c) => String(r[c.key] ?? "")))]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tamcs-roster-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function RosterTable({
  profiles,
  currentUserId,
  canEditRoles,
  isPresident,
  assignableRoles,
}: {
  profiles: Profile[];
  currentUserId: string;
  canEditRoles: boolean;
  isPresident: boolean;
  assignableRoles: UserRole[];
}) {
  const rows = useMemo(() => profiles.map(toRow), [profiles]);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof RowShape>("last_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.class_year,
        r.uin,
        r.role,
      ]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function clickHeader(key: keyof RowShape) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, UIN, role…"
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          {sorted.length} of {rows.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isPresident ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(sorted)}
              disabled={sorted.length === 0}
            >
              Export CSV
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={
                    "px-3 py-2 font-medium " +
                    (c.sortable ? "cursor-pointer select-none hover:text-foreground" : "")
                  }
                  onClick={c.sortable ? () => clickHeader(c.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {c.label}
                    {c.sortable && sortKey === c.key ? (
                      <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No matching members.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.first_name || "—"}</td>
                  <td className="px-3 py-2">{r.last_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.phone || "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.birthday || "—"}
                  </td>
                  <td className="px-3 py-2">{r.class_year || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.uin || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {canEditRoles && r.id !== currentUserId &&
                    !(r.role === "president" && !isPresident) ? (
                      <RoleSelect
                        userId={r.id}
                        currentRole={r.role}
                        options={assignableRoles}
                      />
                    ) : (
                      <span>{r.role}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.joined ? new Date(r.joined).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/roster/${r.id}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
