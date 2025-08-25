export const runtime = "nodejs";                 // {💥외워!} Edge 아님
export const preferredRegion = ["icn1","hnd1"];  // 서울/도쿄 우선

// app/api/rag/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";




type RagRequest = { query: string };
type MinimalQuote = { quote: string; author: string; source: string };

function isRagRequest(v: unknown): v is RagRequest {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.query === "string" && r.query.trim().length > 0;
}

function hashQuery(query: string) {
  return crypto.createHash("sha256").update(query).digest("hex");
}

// 캐시 만료 기준 (예: 7일) {💥외워!}
const CACHE_TTL_DAYS = 7;

// 벡터 매칭 임계값 / 개수 (필요시 조정) {💥외워!}
const VECTOR_THRESHOLD = 0.78;
const VECTOR_TOP_K = 1;

export async function POST(req: Request) {
  // 0) 입력 파싱 & 검증
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
  const query = bodyUnknown.query.trim();

  const admin = getSupabaseAdmin();

  // 1) 캐시 조회 (정확 동일 질의 해시) {💥외워!}
  const queryHash = hashQuery(query);
  try {
    const { data: cached, error: cacheError } = await admin
      .from("quote_cache")
      .select("quote, author, source, created_at")
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (!cacheError && cached) {
      const createdAt = new Date(cached.created_at);
      const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < CACHE_TTL_DAYS) {
        return NextResponse.json(
          { quote: cached.quote, author: cached.author, source: cached.source },
          { status: 200 }
        );
      }
      // 만료 시 계속 진행
    }
  } catch {
    // 캐시 조회 실패시에도 계속 진행
  }

  // 2) 쿼리 로그 (best-effort)
  try {
    await admin.from("messages").insert({ content: query });
  } catch {
    /* ignore */
  }

  // 3) 벡터 유사도 검색 (pgvector RPC) — text-embedding-004 → 768차원 {💥외워!}
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // 임베딩 키 없으면 바로 Genkit 폴백
      throw new Error("Missing GOOGLE_API_KEY");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const embedder = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = await embedder.embedContent(query);
    const queryVec = emb.embedding.values;

    const { data: matches, error: matchErr } = await admin.rpc("match_quotes", {
      query_embedding: queryVec,
      match_threshold: VECTOR_THRESHOLD,
      match_count: VECTOR_TOP_K,
    });

    if (!matchErr && Array.isArray(matches) && matches.length > 0) {
      const top = matches[0]; // { quote, author, source, similarity, ... }
      const minimal: MinimalQuote = {
        quote: top.quote,
        author: top.author,
        source: top.source,
      };

      // 벡터 결과도 캐시에 저장(다음 동일질의 가속)
      try {
        await admin.from("quote_cache").upsert({
          query_hash: queryHash,
          query_text: query,
          quote: minimal.quote,
          author: minimal.author,
          source: minimal.source,
          created_at: new Date().toISOString(),
        });
      } catch {
        /* ignore */
      }

      return NextResponse.json(minimal, { status: 200 });
    }
    // 매치 실패 → Genkit 폴백
  } catch {
    // 임베딩/매치 실패시 Genkit 폴백으로 진행
  }

  // 4) 폴백: Genkit(Cloud Run) 호출
  const base = process.env.GENKIT_API_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing GENKIT_API_URL. Set Cloud Run URL in .env.local / Vercel." },
      { status: 500 }
    );
  }
  const upstream = await fetch(`${base.replace(/\/+$/, "")}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: query }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Genkit error ${upstream.status}: ${text.slice(0, 500)}` },
      { status: 502 }
    );
  }

  const payload = await upstream.json();
  const q = payload?.quote;
  const minimal: MinimalQuote = {
    quote: typeof q?.quote === "string" ? q.quote : "결과 문구 없음",
    author: typeof q?.author === "string" ? q.author : "알 수 없음",
    source: typeof q?.source === "string" ? q.source : "알 수 없음",
  };

  // 5) 캐시 갱신 (upsert)
  try {
    await admin.from("quote_cache").upsert({
      query_hash: queryHash,
      query_text: query,
      quote: minimal.quote,
      author: minimal.author,
      source: minimal.source,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* ignore */
  }

  return NextResponse.json(minimal, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}