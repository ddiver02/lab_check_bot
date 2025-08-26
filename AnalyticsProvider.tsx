"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // page_view를 한 번 쏘는 함수
  const sendPageView = () => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
      // 필요시 디버그 플래그
      // debug_mode: true,
    });
  };

  // 초기 1회 + 라우트 변경 시 전송
  useEffect(() => {
    sendPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaId, pathname, searchParams]);

  return null;
}