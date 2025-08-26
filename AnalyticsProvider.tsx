"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sendAnalytics = () => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // UTM 추출
    const utm: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((key) => {
      const value = searchParams?.get(key);
      if (value) utm[key] = value;
    });

    if (Object.keys(utm).length > 0) {
      localStorage.setItem("utm", JSON.stringify(utm));
    }

    const storedUtm = JSON.parse(localStorage.getItem("utm") || "{}");

    // ⚡ session_start 먼저 전송
    window.gtag("event", "session_start", {
      ...storedUtm,
    });

    // 📄 page_view 전송
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
      ...storedUtm,
    });
  };

  useEffect(() => {
    sendAnalytics();
  }, [gaId, pathname, searchParams]);

  return null;
}