// components/AnalyticsGA4.tsx
/*"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;

    const urlPath = pathname + (search?.toString() ? `?${search}` : "");
    window.gtag("event", "page_view", {
      send_to: gaId,
      page_location: window.location.href,
      page_path: urlPath,
      page_title: document.title,
    });
  }, [pathname, search, gaId]);

  return null;
}*/