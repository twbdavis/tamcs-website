"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, { type: "error" | "success"; text: string }> = {
  not_authorized: {
    type: "error",
    text: "You don't have permission to access that page.",
  },
};

export function DashboardToast() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const key = params.get("error") ?? params.get("success");
    if (!key) return;
    const msg = MESSAGES[key];
    if (msg) {
      toast[msg.type](msg.text);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("success");
      router.replace(url.pathname + url.search);
    }
  }, [params, router]);

  return null;
}
