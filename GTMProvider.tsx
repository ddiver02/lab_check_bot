"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function GTMProvider() {
  const pathname = usePathname();
  const search = useSearchParams();
  const prevPath = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dl = (window as any).dataLayer;
    if (!dl || typeof dl.push !== "function") return;

    const pagePath = pathname + (search?.toString() ? `?${search}` : "");
    if (prevPath.current === pagePath) return;
    prevPath.current = pagePath;

    dl.push({
      event: "pageview",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}

