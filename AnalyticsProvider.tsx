// AnalyticsProvider.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function AnalyticsGA4({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // page_view 전송
    window.gtag?.("event", "page_view", {
      page_location: typeof window !== "undefined" ? window.location.href : url,
      page_path: url,
      page_title: document?.title ?? "",
      send_to: gaId,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}