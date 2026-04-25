import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlogForm } from "@/components/admin/blog-form";
import type { BlogPost } from "@/lib/content-types";

export const metadata = { title: "Edit Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single<BlogPost>();

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link
          href="/admin/blog"
          className="text-muted-foreground hover:text-primary"
        >
          ← Blog
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Edit post</h1>
      <p className="mt-1 text-muted-foreground">{post.title}</p>

      <section className="mt-8 rounded-lg border p-5">
        <BlogForm post={post} redirectAfterSave="/admin/blog" />
      </section>
    </div>
  );
}
