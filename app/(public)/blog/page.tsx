import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Blog" };

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold">Blog</h1>
      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {posts.map((p) => (
            <li key={p.slug} className="border-b pb-8 last:border-none">
              <h2 className="text-2xl font-semibold">
                <Link
                  href={`/blog/${p.slug}`}
                  className="hover:text-primary underline-offset-4 hover:underline"
                >
                  {p.title}
                </Link>
              </h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {new Date(p.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {p.author ? ` · ${p.author}` : null}
              </div>
              {p.excerpt ? (
                <p className="mt-3 text-foreground/85">{p.excerpt}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
