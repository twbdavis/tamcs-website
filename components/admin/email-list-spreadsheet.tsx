"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EMAIL_LIST_CATEGORIES,
  type EmailListCategory,
  type EmailListEntry,
} from "@/lib/content-types";
import {
  autoPopulateFromRosterAction,
  bulkUpdateEmailListAction,
  deleteEmailListEntriesAction,
  importEmailListCsvAction,
  patchEmailListEntryAction,
  upsertEmailListEntryAction,
} from "@/app/actions/email-list";

const CELL_INPUT =
  "w-full bg-transparent px-2 py-1 text-sm outline-none focus:bg-muted/40 focus:ring-1 focus:ring-[#500000]/40 rounded";

const CATEGORY_LABEL: Record<EmailListCategory, string> = {
  athlete: "Athlete",
  officer: "Officer",
  coach: "Coach",
  other: "Other",
};

type SortKey =
  | "first_name"
  | "last_name"
  | "email"
  | "category"
  | "is_active"
  | "dues_type"
  | "dues_paid"
  | "created_at";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(rows: EmailListEntry[]) {
  const headers = [
    "first_name",
    "last_name",
    "email",
    "category",
    "is_active",
    "dues_type",
    "dues_paid",
    "notes",
    "created_at",
  ];
  const lines = [
    headers,
    ...rows.map((r) => [
      r.first_name ?? "",
      r.last_name ?? "",
      r.email,
      r.category,
      String(r.is_active),
      r.dues_type ?? "",
      String(r.dues_paid),
      r.notes ?? "",
      r.created_at,
    ]),
  ]
    .map((row) => row.map((c) => csvEscape(String(c))).join(","))
    .join("\r\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tamcs-email-list-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EmailListSpreadsheet({
  initial,
}: {
  initial: EmailListEntry[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | EmailListCategory>(
    "all",
  );
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("last_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copyCategory, setCopyCategory] = useState<"all" | EmailListCategory>(
    "all",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initial.filter((r) => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterActive === "active" && !r.is_active) return false;
      if (filterActive === "inactive" && r.is_active) return false;
      if (q) {
        const blob = `${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email} ${
          r.notes ?? ""
        }`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [initial, query, filterCategory, filterActive]);

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

  const stats = useMemo(() => {
    let active = 0;
    let paid = 0;
    let owed = 0;
    const byCategory: Record<EmailListCategory, number> = {
      athlete: 0,
      officer: 0,
      coach: 0,
      other: 0,
    };
    for (const r of initial) {
      if (r.is_active) {
        active++;
        byCategory[r.category]++;
        // Only count dues for active rows where a dues type is set.
        if (r.dues_type) {
          if (r.dues_paid) paid++;
          else owed++;
        }
      }
    }
    return { active, paid, owed, byCategory, total: initial.length };
  }, [initial]);

  function toggleSelectAll() {
    if (selected.size === sorted.length && sorted.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((r) => r.id)));
    }
  }
  function toggleSelectRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function patchField(
    id: string,
    field:
      | "first_name"
      | "last_name"
      | "email"
      | "notes"
      | "category"
      | "is_active"
      | "dues_type"
      | "dues_paid",
    value: string | boolean,
  ) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("field", field);
    fd.set("value", typeof value === "boolean" ? String(value) : value);
    startTransition(async () => {
      const res = await patchEmailListEntryAction(null, fd);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  async function copyEmails() {
    const rows = initial.filter((r) => {
      if (!r.is_active) return false;
      if (copyCategory !== "all" && r.category !== copyCategory) return false;
      return true;
    });
    const list = rows.map((r) => r.email).join(", ");
    if (list === "") {
      toast.error("No active emails to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(list);
      toast.success(
        `Copied ${rows.length} email${rows.length === 1 ? "" : "s"} to clipboard.`,
      );
    } catch {
      toast.error("Clipboard write failed.");
    }
  }

  return (
    <div className="grid gap-4">
      <StatsBar stats={stats} />

      <Toolbar
        query={query}
        setQuery={setQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        copyCategory={copyCategory}
        setCopyCategory={setCopyCategory}
        onCopyEmails={copyEmails}
        onExport={() => downloadCsv(sorted)}
        rowsForExport={sorted.length}
      />

      <ActionBar
        selected={selected}
        clearSelection={() => setSelected(new Set())}
      />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  checked={
                    selected.size > 0 && selected.size === sorted.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              <SortHeader
                label="First Name"
                k="first_name"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Last Name"
                k="last_name"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Email"
                k="email"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Category"
                k="category"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Slacktive"
                k="is_active"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Dues Type"
                k="dues_type"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <SortHeader
                label="Paid Dues"
                k="dues_paid"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <th className="px-2 py-2 font-medium">Notes</th>
              <SortHeader
                label="Date Added"
                k="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
              />
              <th className="px-2 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No matching entries.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <Row
                  key={r.id}
                  entry={r}
                  isSelected={selected.has(r.id)}
                  onToggleSelect={() => toggleSelectRow(r.id)}
                  onPatch={patchField}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsBar({
  stats,
}: {
  stats: {
    total: number;
    active: number;
    paid: number;
    owed: number;
    byCategory: Record<EmailListCategory, number>;
  };
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.active}</span>
          <span className="text-sm text-muted-foreground">
            active of {stats.total}
          </span>
        </div>
        <span className="text-sm">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {stats.paid}
          </span>{" "}
          paid ·{" "}
          <span className="font-semibold text-rose-700 dark:text-rose-400">
            {stats.owed}
          </span>{" "}
          owed
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EMAIL_LIST_CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
          >
            {CATEGORY_LABEL[c]}: <strong>{stats.byCategory[c]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function Toolbar({
  query,
  setQuery,
  filterCategory,
  setFilterCategory,
  filterActive,
  setFilterActive,
  copyCategory,
  setCopyCategory,
  onCopyEmails,
  onExport,
  rowsForExport,
}: {
  query: string;
  setQuery: (v: string) => void;
  filterCategory: "all" | EmailListCategory;
  setFilterCategory: (v: "all" | EmailListCategory) => void;
  filterActive: "all" | "active" | "inactive";
  setFilterActive: (v: "all" | "active" | "inactive") => void;
  copyCategory: "all" | EmailListCategory;
  setCopyCategory: (v: "all" | EmailListCategory) => void;
  onCopyEmails: () => void;
  onExport: () => void;
  rowsForExport: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [populateState, populateAction, populating] = useActionState(
    autoPopulateFromRosterAction,
    null,
  );
  const [importState, importAction, importing] = useActionState(
    importEmailListCsvAction,
    null,
  );
  const [addState, addAction, adding] = useActionState(
    upsertEmailListEntryAction,
    null,
  );

  useEffect(() => {
    if (populateState?.error) toast.error(populateState.error);
    if (populateState?.success) {
      toast.success(populateState.success);
      router.refresh();
    }
  }, [populateState, router]);

  useEffect(() => {
    if (importState?.error) toast.error(importState.error);
    if (importState?.success) {
      toast.success(importState.success);
      router.refresh();
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [importState, router]);

  useEffect(() => {
    if (addState?.error) toast.error(addState.error);
    if (addState?.success) {
      toast.success("Row added.");
      router.refresh();
    }
  }, [addState, router]);

  function quickAdd() {
    const email = window.prompt("Email for the new row:");
    if (!email) return;
    const fd = new FormData();
    fd.set("email", email);
    fd.set("category", "other");
    fd.set("is_active", "on");
    startTransition(() => addAction(fd));
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, notes…"
        />
        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as "all" | EmailListCategory)
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All categories</option>
          {EMAIL_LIST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) =>
            setFilterActive(e.target.value as "all" | "active" | "inactive")
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={quickAdd} disabled={adding}>
          + Add row
        </Button>
        <form action={populateAction}>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={populating}
          >
            {populating ? "Syncing…" : "Auto-populate from roster"}
          </Button>
        </form>

        <form action={importAction} className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importing…" : "Import CSV"}
          </Button>
        </form>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onExport}
          disabled={rowsForExport === 0}
        >
          Export CSV
        </Button>

        <span className="ml-auto flex items-center gap-2">
          <select
            value={copyCategory}
            onChange={(e) =>
              setCopyCategory(e.target.value as "all" | EmailListCategory)
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">All categories</option>
            {EMAIL_LIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]} only
              </option>
            ))}
          </select>
          <Button type="button" size="sm" onClick={onCopyEmails}>
            Copy active emails
          </Button>
        </span>
      </div>
    </div>
  );
}

function ActionBar({
  selected,
  clearSelection,
}: {
  selected: Set<string>;
  clearSelection: () => void;
}) {
  const router = useRouter();
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteEmailListEntriesAction,
    null,
  );
  const [bulkState, bulkAction, bulking] = useActionState(
    bulkUpdateEmailListAction,
    null,
  );

  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) {
      toast.success(deleteState.success);
      clearSelection();
      router.refresh();
    }
  }, [deleteState, clearSelection, router]);

  useEffect(() => {
    if (bulkState?.error) toast.error(bulkState.error);
    if (bulkState?.success) {
      toast.success(bulkState.success);
      clearSelection();
      router.refresh();
    }
  }, [bulkState, clearSelection, router]);

  if (selected.size === 0) return null;
  const ids = Array.from(selected);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
      <span className="font-medium">{selected.size} selected</span>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (
            !window.confirm(
              `Delete ${selected.size} row${selected.size === 1 ? "" : "s"}?`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={deleting}
        >
          Delete
        </Button>
      </form>

      <form action={bulkAction} className="flex items-center gap-2">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="category" />
        <select
          name="value"
          defaultValue=""
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="" disabled>
            Set category…
          </option>
          {EMAIL_LIST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Apply
        </Button>
      </form>

      <form action={bulkAction} className="flex items-center gap-1">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="active" />
        <input type="hidden" name="value" value="true" />
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Activate
        </Button>
      </form>
      <form action={bulkAction} className="flex items-center gap-1">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="active" />
        <input type="hidden" name="value" value="false" />
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Deactivate
        </Button>
      </form>

      <form action={bulkAction} className="flex items-center gap-2">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="dues_type" />
        <select
          name="value"
          defaultValue="full_year"
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="Bulk set dues type"
        >
          <option value="full_year">Full Year</option>
          <option value="semester">Semester</option>
          <option value="">— None —</option>
        </select>
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Apply
        </Button>
      </form>

      <form action={bulkAction} className="flex items-center gap-1">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="dues_paid" />
        <input type="hidden" name="value" value="true" />
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Mark paid
        </Button>
      </form>
      <form action={bulkAction} className="flex items-center gap-1">
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <input type="hidden" name="op" value="dues_paid" />
        <input type="hidden" name="value" value="false" />
        <Button type="submit" size="sm" variant="outline" disabled={bulking}>
          Mark unpaid
        </Button>
      </form>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={clearSelection}
        className="ml-auto"
      >
        Clear
      </Button>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  setSortKey,
  setSortDir,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  setSortKey: (k: SortKey) => void;
  setSortDir: (d: "asc" | "desc") => void;
}) {
  const active = sortKey === k;
  return (
    <th
      className="cursor-pointer select-none px-2 py-2 font-medium hover:text-foreground"
      onClick={() => {
        if (active) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else {
          setSortKey(k);
          setSortDir("asc");
        }
      }}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span> : null}
      </span>
    </th>
  );
}

function Row({
  entry,
  isSelected,
  onToggleSelect,
  onPatch,
}: {
  entry: EmailListEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPatch: (
    id: string,
    field:
      | "first_name"
      | "last_name"
      | "email"
      | "notes"
      | "category"
      | "is_active"
      | "dues_type"
      | "dues_paid",
    value: string | boolean,
  ) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete ${entry.email}?`)) return;
    const fd = new FormData();
    fd.append("ids", entry.id);
    startTransition(async () => {
      const res = await deleteEmailListEntriesAction(null, fd);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <tr className="border-t">
      <td className="px-2 py-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Select ${entry.email}`}
        />
      </td>
      <td className="px-1 py-1">
        <CellInput
          defaultValue={entry.first_name ?? ""}
          onCommit={(v) => onPatch(entry.id, "first_name", v)}
        />
      </td>
      <td className="px-1 py-1">
        <CellInput
          defaultValue={entry.last_name ?? ""}
          onCommit={(v) => onPatch(entry.id, "last_name", v)}
        />
      </td>
      <td className="px-1 py-1">
        <CellInput
          defaultValue={entry.email}
          onCommit={(v) => onPatch(entry.id, "email", v)}
          type="email"
        />
      </td>
      <td className="px-1 py-1">
        <select
          defaultValue={entry.category}
          onChange={(e) => onPatch(entry.id, "category", e.target.value)}
          className={CELL_INPUT}
        >
          {EMAIL_LIST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={entry.is_active}
          onChange={(e) => onPatch(entry.id, "is_active", e.target.checked)}
        />
      </td>
      <td className="px-1 py-1">
        <select
          value={entry.dues_type ?? ""}
          onChange={(e) => onPatch(entry.id, "dues_type", e.target.value)}
          className={CELL_INPUT}
        >
          <option value="">—</option>
          <option value="full_year">Full Year</option>
          <option value="semester">Semester</option>
        </select>
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={entry.dues_paid}
          onChange={(e) => onPatch(entry.id, "dues_paid", e.target.checked)}
        />
      </td>
      <td className="px-1 py-1">
        <CellInput
          defaultValue={entry.notes ?? ""}
          onCommit={(v) => onPatch(entry.id, "notes", v)}
        />
      </td>
      <td className="px-2 py-1 text-muted-foreground">
        {formatDate(entry.created_at)}
      </td>
      <td className="px-2 py-1 text-right">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}

function CellInput({
  defaultValue,
  onCommit,
  type = "text",
}: {
  defaultValue: string;
  onCommit: (v: string) => void;
  type?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  // Sync on prop change (after router.refresh).
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== defaultValue) onCommit(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(defaultValue);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={CELL_INPUT}
    />
  );
}
