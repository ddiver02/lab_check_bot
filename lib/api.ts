import { Mode, MinimalQuote } from "../types/app.d";

// 클라이언트 API: 로컬 Next 라우트(/api/rag) 사용으로 JSON 보장
export async function fetchQuote(query: string, mode: Mode): Promise<MinimalQuote> {
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

  const data = await r.json();
  if (!r.ok) throw new Error((data as any)?.error || "요청 실패");
  return data as MinimalQuote;
}
