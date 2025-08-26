"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = { gaId: string };

// gtag 준비될 때까지 대기 (최대 2초)
function waitForGtag(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") return resolve();
    const started = Date.now();
    const t = setInterval(() => {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        clearInterval(t);
        resolve();
      } else if (Date.now() - started > 2000) {
        clearInterval(t);
        resolve(); // 시간초과해도 진행 (그냥 한 번 더 시도)
      }
    }, 50);
  });
}

export default function AnalyticsGA4({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentRef = useRef<string>("");

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;

      // 1) gtag 준비까지 대기
      await waitForGtag();

      // 2) URL 조립 — 첫 로드에선 searchParams가 비어있을 수 있어서
      //    window.location.search를 우선 사용
      const qs =
        (typeof window !== "undefined" && window.location.search) ||
        (searchParams?.toString() ? `?${searchParams}` : "");
      const pathWithQuery = pathname + (qs || "");

      // 중복 방지
      if (sentRef.current === pathWithQuery) return;
      sentRef.current = pathWithQuery;

      // 3) 최초 터치 UTM 저장(이미 있으면 보존)
      try {
        const firstTouch = localStorage.getItem("utm:firstTouch");
        if (!firstTouch) {
          const params = new URLSearchParams(qs || "");
          const utm: Record<string, string> = {};
          ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
            const v = params.get(k);
            if (v) utm[k] = v;
          });
          if (Object.keys(utm).length) {
            localStorage.setItem("utm:firstTouch", JSON.stringify(utm));
          }
        }
      } catch {}

      const storedUtm =
        (typeof window !== "undefined" &&
          JSON.parse(localStorage.getItem("utm:firstTouch") || "{}")) ||
        {};

      // 4) SPA 권장 방식: config로 page_view 트리거 (초기화에서 send_page_view:false이므로)
      if (typeof window.gtag === "function") {
        window.gtag("config", gaId, {
          page_path: pathWithQuery,
          page_location: window.location.href, // ← UTM 포함된 풀 URL
          page_title: document.title,
          ...storedUtm, // 커스텀 파라미터로도 남길 수 있음(원하면 GA4에서 커스텀 정의 등록)
        });
      }
    })();
  }, [gaId, pathname, searchParams]);

  return null;
}