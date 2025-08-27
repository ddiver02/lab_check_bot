import { Mode, MinimalQuote } from "../types/app.d";

export async function fetchQuote(query: string, mode: Mode): Promise<MinimalQuote> {
  const r = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "요청 실패");
  return data as MinimalQuote;
}