"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = { gaId: string };

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 중복 전송 가드
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const qs = searchParams?.toString() ?? "";
    const pathWithQuery = pathname + (qs ? `?${qs}` : "");

    // 🔒 동일 경로/쿼리로 중복 전송 방지
    if (lastSentRef.current === pathWithQuery) return;
    lastSentRef.current = pathWithQuery;

    // 🏷️ 최초 터치 UTM 저장(이미 저장돼 있으면 유지)
    const firstUtmRaw = localStorage.getItem("utm:firstTouch");
    if (!firstUtmRaw && qs) {
      const utm: Record<string, string> = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
        const v = searchParams?.get(k);
        if (v) utm[k] = v;
      });
      if (Object.keys(utm).length) {
        localStorage.setItem("utm:firstTouch", JSON.stringify(utm));
      }
    }
    const storedUtm = JSON.parse(localStorage.getItem("utm:firstTouch") || "{}");

    // ✅ page_view 트리거 (send_page_view:false 초기화가 선행되어야 함)
    window.gtag("config", gaId, {
      page_path: pathWithQuery,
      page_location: window.location.href,
      page_title: document.title,
      // 아래 UTM들은 "커스텀 정의"를 만들면 탐색/이벤트 보고서에서 조회 가능
      ...storedUtm,
    });

    // (선택) 디버그 이벤트
    // window.gtag("event", "utm_captured", storedUtm);

  }, [gaId, pathname, searchParams]);

  return null;
}