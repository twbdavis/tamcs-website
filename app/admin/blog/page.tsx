import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BlogForm } from "@/components/admin/blog-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogPostAction } from "@/app/actions/blog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type { BlogPost } from "@/lib/content-types";

export const metadata = { title: "Manage Blog" };

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BlogPost[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Blog</h1>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Add new post</h2>
        <BlogForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">All posts</h2>
        {!posts || posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.author ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.is_published ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link
                        href={`/admin/blog/${p.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteBlogPostAction}
                        id={p.id}
                        confirmMessage={`Delete "${p.title}"?`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
