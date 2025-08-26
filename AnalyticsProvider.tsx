"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sendPageView = () => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    // URL path + querystring
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // UTM 파라미터 추출
    const utm: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((key) => {
      const value = searchParams?.get(key);
      if (value) utm[key] = value;
    });

    // localStorage에도 저장 (세션 내 유지)
    if (Object.keys(utm).length > 0) {
      localStorage.setItem("utm", JSON.stringify(utm));
    }

    // 이전에 저장된 UTM 불러오기
    const storedUtm = JSON.parse(localStorage.getItem("utm") || "{}");

    // page_view 이벤트 전송
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
      ...storedUtm, // ✅ 여기서 UTM이 항상 전달되게
    });
  };

  useEffect(() => {
    sendPageView();
  }, [gaId, pathname, searchParams]);

  return null;
}