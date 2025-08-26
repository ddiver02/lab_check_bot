"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId || typeof window === "undefined" || !window.gtag) return;

    const url =
      (pathname || "/") +
      (searchParams && searchParams.toString() ? `?${searchParams.toString()}` : "");

    window.gtag("event", "page_view", {
      page_location: window.location.origin + url,
      page_path: url,
      page_title: document.title,
      send_to: gaId,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}