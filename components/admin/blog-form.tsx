"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertBlogPostAction } from "@/app/actions/blog";
import type { BlogPost } from "@/lib/content-types";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function BlogForm({
  post,
  redirectAfterSave,
}: {
  post?: BlogPost;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertBlogPostAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      if (redirectAfterSave) router.push(redirectAfterSave);
      else if (!post) formRef.current?.reset();
    }
  }, [state, post, redirectAfterSave, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={post?.title ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={post?.slug ?? ""}
            placeholder="auto-generated from title"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            name="author"
            defaultValue={post?.author ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="published_at">Publish date (optional)</Label>
          <Input
            id="published_at"
            name="published_at"
            type="datetime-local"
            defaultValue={toLocalInput(post?.published_at)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="content">Content (Markdown)</Label>
        <textarea
          id="content"
          name="content"
          defaultValue={post?.content ?? ""}
          rows={14}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={post?.is_published ?? false}
          className="size-4 rounded border-input"
        />
        Published (visible to the public)
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : post ? "Save changes" : "Add post"}
        </Button>
      </div>
    </form>
  );
}
