import { Mode, MinimalQuote } from "../types/app.d";

// 클라이언트 API
// Option A: "/api/quote" -> next.config.ts의 rewrite로 Cloud Run API에 프록시
// (NEXT_PUBLIC_GENKIT_API_URL이 설정되어 있어야 동작)
export async function fetchQuote(query: string, mode: Mode): Promise<MinimalQuote> {
  // 내부 API 라우트로 직접 호출 (외부 프록시 미사용 시 안정)
  const r = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });

  // Content-Type이 JSON이 아니면 HTML 에러 등으로 간주하여 텍스트를 노출
  const ctype = r.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    const text = await r.text();
    throw new Error(`서버 오류(비JSON 응답): ${text.slice(0, 120)}...`);
  }

  const data: unknown = await r.json();
  if (!r.ok) {
    const msg =
      data && typeof data === "object" && "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "요청 실패";
    throw new Error(msg);
  }
  return data as MinimalQuote;
}
