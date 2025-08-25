import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";


type RagRequest = { query: string };
type MinimalQuote = { quote: string; author: string; source: string };

function isRagRequest(v: unknown): v is RagRequest {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.query === "string" && r.query.trim().length > 0;
}

export async function POST(req: Request) {
  // 1) 입력 검증
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isRagRequest(bodyUnknown)) {
    return NextResponse.json(
      { error: "Invalid request: 'query' must be a non-empty string." },
      { status: 400 }
    );
  }
  const query = bodyUnknown.query;
  const { error } = await supabaseAdmin
    .from("messages")
    .insert({ content: query });

  if (error) {
    console.error("❌ Supabase insert error:", error.message);
  }
  // 2) 환경변수 확인
  const base = process.env.GENKIT_API_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing GENKIT_API_URL. Set Cloud Run URL in .env.local / Vercel." },
      { status: 500 }
    );
  }

  // 3) Genkit 커스텀 라우트 호출 (POST <RUN_URL>/api/quote)
  const upstream = await fetch(`${base.replace(/\/+$/, "")}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: query }),
    // 중요: 서버 간 호출이라 캐시 비활성화가 안전 {💥외워!}
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Genkit error ${upstream.status}: ${text.slice(0, 500)}` },
      { status: 502 }
    );
  }

  // 4) ▶ 최소 필드만 추출해서 반환 ◀
  const payload = (await upstream.json());
  const q = payload?.quote;

  const minimal: MinimalQuote = {
    quote: typeof q?.quote === "string" ? q.quote : "결과 문구 없음",
    author: typeof q?.author === "string" ? q.author : "알 수 없음",
    source: typeof q?.source === "string" ? q.source : "알 수 없음",
  };

  return NextResponse.json(minimal, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}