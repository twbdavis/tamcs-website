"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/auth/require-admin-action";

type FormState = { error?: string; success?: string };

function nullable(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function required(v: FormDataEntryValue | null, name: string) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(`${name} is required`);
  return s;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function upsertBlogPostAction(
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const auth = await getAdminClient();
  if ("error" in auth) return { error: auth.error };

  let payload;
  try {
    const title = required(formData.get("title"), "Title");
    const rawSlug = nullable(formData.get("slug"));
    const slug = rawSlug ?? slugify(title);
    if (!slug) return { error: "Could not derive slug from title" };

    const isPublished = formData.get("is_published") === "on";
    const publishedAtRaw = nullable(formData.get("published_at"));

    payload = {
      title,
      slug,
      content: (formData.get("content") as string | null) ?? "",
      author: nullable(formData.get("author")),
      is_published: isPublished,
      published_at: publishedAtRaw
        ? new Date(publishedAtRaw).toISOString()
        : isPublished
          ? new Date().toISOString()
          : null,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id.length > 0;

  const { error } = isUpdate
    ? await auth.supabase.from("blog_posts").update(payload).eq("id", id)
    : await auth.supabase.from("blog_posts").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: isUpdate ? "Post updated." : "Post added." };
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const auth = await getAdminClient();
  if ("error" in auth) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await auth.supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
