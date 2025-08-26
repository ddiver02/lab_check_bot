// AnalyticsProvider.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const prevPath = useRef<string>("");

  useEffect(() => {
    if (!gaId || typeof window === "undefined" || typeof window.gtag !== "function") return;

    // 클라이언트 라우팅 시 URL 변경만 감지하여 page_view 보완 전송
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      window.gtag("config", gaId, {
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [gaId, pathname]);

  return null;
}