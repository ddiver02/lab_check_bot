import { NextResponse } from "next/server";

type RagRequest = { query: string };

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

  // 2) 환경변수 확인
  const base = process.env.GENKIT_API_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing GENKIT_API_URL. Set Cloud Run URL in .env.local / Vercel." },
      { status: 500 }
    );
  }

  // 3) Genkit(Cloud Run) 커스텀 라우트 호출: POST <RUN_URL>/api/quote
  //    우리 서버(index.ts)에 만든 express 라우트가 `input: string` 을 받음
  const upstream = await fetch(`${base.replace(/\/+$/, "")}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: query }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Genkit error ${upstream.status}: ${text.slice(0, 500)}` },
      { status: 502 }
    );
  }

  // 4) 성공 응답 그대로 전달
  const data = await upstream.json();
  return NextResponse.json(data, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}