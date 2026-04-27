"use server";

import { revalidatePath } from "next/cache";
import { getAuthedClient } from "@/lib/auth/require-admin-action";
import {
  EMAIL_LIST_CATEGORIES,
  type EmailListCategory,
  type EmailListDuesType,
} from "@/lib/content-types";

type FormState = { error?: string; success?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asCategory(v: unknown): EmailListCategory | null {
  return typeof v === "string" &&
    (EMAIL_LIST_CATEGORIES as string[]).includes(v)
    ? (v as EmailListCategory)
    : null;
}

function asDuesType(v: unknown): EmailListDuesType | null {
  if (v === "full_year" || v === "semester") return v;
  return null;
}

function asBool(v: unknown): boolean {
  return v === "true" || v === "on" || v === true;
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

function revalidateAll() {
  revalidatePath("/dashboard/email-list");
}

export async function upsertEmailListEntryAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const idRaw = formData.get("id");
  const isUpdate = typeof idRaw === "string" && idRaw.length > 0;

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
    return { error: "Email must be a valid address" };
  }
  const category = asCategory(formData.get("category")) ?? "other";
  const is_active = asBool(formData.get("is_active"));
  const dues_type = asDuesType(formData.get("dues_type"));
  const dues_paid = asBool(formData.get("dues_paid"));

  const payload = {
    email: emailRaw,
    first_name: trimOrNull(formData.get("first_name")),
    last_name: trimOrNull(formData.get("last_name")),
    category,
    is_active,
    dues_type,
    dues_paid,
    notes: trimOrNull(formData.get("notes")),
  };

  if (isUpdate) {
    const { error } = await auth.supabase
      .from("email_list")
      .update(payload)
      .eq("id", idRaw);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.supabase
      .from("email_list")
      .insert({ ...payload, added_by: auth.userId });
    if (error) return { error: error.message };
  }

  revalidateAll();
  return { success: "Saved." };
}

export async function patchEmailListEntryAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing id" };
  const field = String(formData.get("field") ?? "");
  const valueRaw = formData.get("value");

  const patch: Record<string, unknown> = {};
  switch (field) {
    case "first_name":
    case "last_name":
    case "notes":
      patch[field] = trimOrNull(valueRaw);
      break;
    case "email": {
      const v = String(valueRaw ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(v)) return { error: "Invalid email" };
      patch.email = v;
      break;
    }
    case "category": {
      const c = asCategory(valueRaw);
      if (!c) return { error: "Invalid category" };
      patch.category = c;
      break;
    }
    case "is_active":
    case "dues_paid":
      patch[field] = valueRaw === "true" || valueRaw === "on";
      break;
    case "dues_type": {
      // Empty string means "no dues type set" — store null.
      if (typeof valueRaw === "string" && valueRaw === "") {
        patch.dues_type = null;
        break;
      }
      const dt = asDuesType(valueRaw);
      if (!dt) return { error: "Invalid dues type" };
      patch.dues_type = dt;
      break;
    }
    default:
      return { error: "Unknown field" };
  }

  const { error } = await auth.supabase
    .from("email_list")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return { success: "Saved." };
}

export async function deleteEmailListEntriesAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "No rows selected" };

  const { error } = await auth.supabase
    .from("email_list")
    .delete()
    .in("id", ids);
  if (error) return { error: error.message };

  revalidateAll();
  return { success: `Deleted ${ids.length} row${ids.length === 1 ? "" : "s"}.` };
}

export async function bulkUpdateEmailListAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "No rows selected" };

  const op = String(formData.get("op") ?? "");
  let patch: Record<string, unknown> = {};
  if (op === "category") {
    const c = asCategory(formData.get("value"));
    if (!c) return { error: "Invalid category" };
    patch = { category: c };
  } else if (op === "active") {
    patch = { is_active: formData.get("value") === "true" };
  } else if (op === "dues_paid") {
    patch = { dues_paid: formData.get("value") === "true" };
  } else if (op === "dues_type") {
    const v = formData.get("value");
    if (v === "" || v === null) {
      patch = { dues_type: null };
    } else {
      const dt = asDuesType(v);
      if (!dt) return { error: "Invalid dues type" };
      patch = { dues_type: dt };
    }
  } else {
    return { error: "Unknown bulk operation" };
  }

  const { error } = await auth.supabase
    .from("email_list")
    .update(patch)
    .in("id", ids);
  if (error) return { error: error.message };

  revalidateAll();
  return {
    success: `Updated ${ids.length} row${ids.length === 1 ? "" : "s"}.`,
  };
}

function categoryForRole(role: string | null | undefined): EmailListCategory {
  switch (role) {
    case "athlete":
      return "athlete";
    case "officer":
    case "admin":
    case "president":
      return "officer";
    case "coach":
      return "coach";
    default:
      return "other";
  }
}

export async function autoPopulateFromRosterAction(
  _prev: FormState | null,
  _formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  // Mirror the roster page's "active roster" filter: anyone onboarded and
  // approved, or anyone in a role-bypassed category. @tamu.edu only.
  const { data: people, error: profileErr } = await auth.supabase
    .from("profiles")
    .select("email, first_name, last_name, role")
    .or(
      "and(onboarding_completed.eq.true,account_approved.eq.true),role.in.(coach,officer,admin,president,alumni)",
    )
    .ilike("email", "%@tamu.edu")
    .returns<{
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      role: string | null;
    }[]>();
  if (profileErr) return { error: profileErr.message };

  const rows = (people ?? [])
    .filter((p) => !!p.email)
    .map((p) => ({
      email: (p.email as string).toLowerCase(),
      first_name: p.first_name,
      last_name: p.last_name,
      category: categoryForRole(p.role),
      is_active: true,
      added_by: auth.userId,
    }));

  if (rows.length === 0) {
    return { success: "No roster members found to add." };
  }

  // upsert on email so existing rows update names/category but keep
  // anything else (notes, manual is_active flips after this run, etc.).
  const { error } = await auth.supabase
    .from("email_list")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: false });
  if (error) return { error: error.message };

  revalidateAll();
  return {
    success: `Synced ${rows.length} roster member${rows.length === 1 ? "" : "s"}.`,
  };
}

function parseCsv(text: string): string[][] {
  // Minimal CSV reader: handles quoted fields with embedded commas/quotes.
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        if (row.some((v) => v.trim() !== "")) rows.push(row);
        row = [];
      } else {
        cur += c;
      }
    }
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

type ImportableRow = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  category: EmailListCategory;
  is_active: boolean;
  dues_type: EmailListDuesType | null;
  dues_paid: boolean;
};

export async function importEmailListCsvAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAuthedClient("officer");
  if ("error" in auth) return { error: auth.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick a CSV file to upload" };
  }
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return { error: "CSV is empty" };

  // Header row decides which columns map where. Recognized columns:
  //   email | first_name | last_name | category | is_active | active | notes
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const emailIdx = headers.indexOf("email");
  if (emailIdx === -1) {
    return { error: 'CSV must have an "email" column' };
  }
  const firstIdx = headers.findIndex((h) =>
    ["first_name", "first name", "first"].includes(h),
  );
  const lastIdx = headers.findIndex((h) =>
    ["last_name", "last name", "last"].includes(h),
  );
  const categoryIdx = headers.indexOf("category");
  const activeIdx = headers.findIndex((h) =>
    ["is_active", "active"].includes(h),
  );
  const duesTypeIdx = headers.findIndex((h) =>
    ["dues_type", "dues type", "dues"].includes(h),
  );
  const duesPaidIdx = headers.findIndex((h) =>
    ["dues_paid", "dues paid", "paid_dues", "paid dues", "paid"].includes(h),
  );

  const out: ImportableRow[] = [];
  let skipped = 0;
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const email = (cells[emailIdx] ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      skipped++;
      continue;
    }
    const first = firstIdx >= 0 ? trimOrNull(cells[firstIdx]) : null;
    const last = lastIdx >= 0 ? trimOrNull(cells[lastIdx]) : null;
    const cat =
      categoryIdx >= 0 ? asCategory(cells[categoryIdx]?.trim().toLowerCase()) : null;
    const activeRaw = activeIdx >= 0 ? cells[activeIdx]?.trim().toLowerCase() : "";
    const is_active = !["false", "0", "no", "n", "inactive"].includes(activeRaw);
    const duesRaw =
      duesTypeIdx >= 0 ? (cells[duesTypeIdx] ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
    const dues_type =
      duesRaw === "full_year" || duesRaw === "fullyear" || duesRaw === "year"
        ? "full_year"
        : duesRaw === "semester"
          ? "semester"
          : null;
    const paidRaw =
      duesPaidIdx >= 0 ? (cells[duesPaidIdx] ?? "").trim().toLowerCase() : "";
    const dues_paid = ["true", "1", "yes", "y", "paid"].includes(paidRaw);
    out.push({
      email,
      first_name: first,
      last_name: last,
      category: cat ?? "other",
      is_active,
      dues_type,
      dues_paid,
    });
  }

  if (out.length === 0) {
    return { error: "No valid rows found in CSV" };
  }

  const payload = out.map((r) => ({ ...r, added_by: auth.userId }));
  const { error } = await auth.supabase
    .from("email_list")
    .upsert(payload, { onConflict: "email", ignoreDuplicates: false });
  if (error) return { error: error.message };

  revalidateAll();
  return {
    success:
      `Imported ${out.length} row${out.length === 1 ? "" : "s"}` +
      (skipped > 0 ? ` (${skipped} skipped — invalid email).` : "."),
  };
}

