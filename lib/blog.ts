import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogFrontmatter = {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  featuredImage?: string;
  tags?: string[];
};

export type BlogPostMeta = BlogFrontmatter & { slug: string };

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const files = await fs.readdir(BLOG_DIR).catch(() => [] as string[]);
  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    posts.push({
      ...(data as BlogFrontmatter),
      slug: file.replace(/\.mdx$/, ""),
    });
  }

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR).catch(() => [] as string[]);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
