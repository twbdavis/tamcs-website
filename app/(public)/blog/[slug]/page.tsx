import { notFound } from "next/navigation";
import { getPostSlugs, type BlogFrontmatter } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function loadPost(slug: string) {
  try {
    const mod = await import(`../../../../content/blog/${slug}.mdx`);
    return mod as {
      default: React.ComponentType;
      frontmatter: BlogFrontmatter;
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const mod = await loadPost(slug);
  if (!mod) return {};
  return { title: mod.frontmatter.title };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const mod = await loadPost(slug);
  if (!mod) notFound();

  const Content = mod.default;
  const fm = mod.frontmatter;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">{fm.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {new Date(fm.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {fm.author ? ` · ${fm.author}` : null}
        </div>
      </header>
      <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary">
        <Content />
      </div>
    </article>
  );
}
