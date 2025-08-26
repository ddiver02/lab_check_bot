"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 최초 진입 시 UTM 파라미터 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    const content = params.get("utm_content");

    if (source || medium || campaign || content) {
      localStorage.setItem(
        "utm",
        JSON.stringify({ source, medium, campaign, content })
      );
    }
  }, []);

  // page_view를 쏘는 함수
  const sendPageView = () => {
     if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

  // 1) UTM 파라미터 있으면 localStorage에 저장
  if (searchParams) {
    const utmParams: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((k) => {
      const v = searchParams.get(k);
      if (v) utmParams[k] = v;
    });
    if (Object.keys(utmParams).length > 0) {
      localStorage.setItem("utm", JSON.stringify(utmParams));
    }
  }

  // 2) localStorage에서 꺼내오기
  const utm = JSON.parse(localStorage.getItem("utm") || "{}");

  // 3) GA4 page_view 이벤트 전송
  window.gtag("event", "page_view", {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
    ...utm, // ← utm_source, utm_medium, utm_campaign 같이 전달
  });
  };

  // 초기 1회 + 라우트 변경 시 전송
  useEffect(() => {
    sendPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaId, pathname, searchParams]);

  return null;
}