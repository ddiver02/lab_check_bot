// app/api/rag/route.ts
export const runtime = "nodejs";                 // Edge 아님
export const preferredRegion = ["icn1", "hnd1"]; // 서울/도쿄 우선

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CandidateRow = {
  id: number;
  quote: string;
  author: string;
  source: string;
  similarity: number; // 0~1
};

type Mode = "harsh" | "comfort" | "random";
type RagRequest = { query?: string; mode?: Mode };
type MinimalQuote = { quote: string; author: string; source: string };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function hashQuery(query: string, mode: Mode) {
  return crypto.createHash("sha256").update(`${mode}|${query}`).digest("hex");
}

const CACHE_TTL_DAYS = 7;
const VECTOR_THRESHOLD = 0.78;
const VECTOR_TOP_K = 1;

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  // 0) 요청 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const obj = (body ?? {}) as RagRequest;
  const mode: Mode = obj.mode ?? "comfort";
  const rawQuery = typeof obj.query === "string" ? obj.query : "";
  const query = rawQuery.trim();

  // ✅ 모든 모드에서 query 필수 (random 포함)
  if (!query) {
    return NextResponse.json(
      { error: "Invalid request: 'query' must be a non-empty string." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // 1) 캐시 조회 (모드 포함 키)
  const queryHash = hashQuery(query, mode);
  try {
    const { data: cached, error: cacheErr } = await admin
      .from("quote_cache")
      .select("quote, author, source, created_at")
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (!cacheErr && cached) {
      const createdAt = new Date(cached.created_at);
      const ageDays =
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < CACHE_TTL_DAYS) {
        const minimal: MinimalQuote = {
          quote: cached.quote,
          author: cached.author,
          source: cached.source,
        };
        return NextResponse.json(minimal, { status: 200 });
      }
    }
  } catch {
    // 캐시 조회 실패 시 계속 진행
  }

  // 2) 질의 로그(best-effort)
  try {
    await admin.from("messages").insert({ content: `[${mode}] ${query}` });
  } catch {
    /* ignore */
  }

// ...위쪽 동일

// 3) 랜덤 모드 → DB에서 바로 랜덤 1개 선택 (Cloud Run 호출 안 함)
if (mode === "random") {
  const admin = getSupabaseAdmin();

  // 3-1) 전체 개수 알아내기
  const { count, error: cntErr } = await admin
    .from("quote_embeddings")
    .select("id", { count: "exact", head: true });

  if (cntErr || !count || count <= 0) {
    return NextResponse.json(
      { error: "No quotes available in DB." },
      { status: 500 }
    );
  }

  // 3-2) 0..count-1 중 임의 offset
  const offset = Math.floor(Math.random() * count);

  // 3-3) offset에서 1개만 조회
  const { data, error } = await admin
    .from("quote_embeddings")
    .select("quote, author, source")
    .range(offset, offset); // LIMIT 1 with offset

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: "Failed to fetch random quote." },
      { status: 500 }
    );
  }

  const row = data[0];
  const minimal: MinimalQuote = {
    quote: row.quote,
    author: row.author,
    source: row.source,
  };

  // 캐시 저장(키는 모드+고정프롬프트)
  try {
    const queryHash = hashQuery(query, mode); // query는 위에서 "random vibe"로 설정됨
    await admin.from("quote_cache").upsert({
      query_hash: queryHash,
      query_text: "[RANDOM]",
      quote: minimal.quote,
      author: minimal.author,
      source: minimal.source,
      created_at: new Date().toISOString(),
    });
  } catch { /* ignore */ }

  return NextResponse.json(minimal, { status: 200 });
}

  // 4) 벡터 유사도 검색 시도 (harsh/comfort)
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    // 임베딩 생성 (text-embedding-004 → 768D)
    const genAI = new GoogleGenerativeAI(apiKey);
    const embedder = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = await embedder.embedContent(query);
    const queryVec = emb.embedding.values;

    // RPC 이름 폴백: match_quotes → match_quote_embeddings
    let matches: CandidateRow[] | null = null;

    const r1 = await admin.rpc("match_quotes", {
      query_embedding: queryVec,
      match_threshold: VECTOR_THRESHOLD,
      match_count: VECTOR_TOP_K,
    });
    if (!r1.error && Array.isArray(r1.data)) {
      matches = r1.data as CandidateRow[];
    } else {
      const r2 = await admin.rpc("match_quote_embeddings", {
        query_embedding: queryVec,
        match_threshold: VECTOR_THRESHOLD,
        match_count: VECTOR_TOP_K,
      });
      if (!r2.error && Array.isArray(r2.data)) {
        matches = r2.data as CandidateRow[];
      }
    }

    if (matches && matches.length > 0) {
      const top = matches[0];
      const minimal: MinimalQuote = {
        quote: top.quote,
        author: top.author,
        source: top.source,
      };

      try {
        await admin.from("quote_cache").upsert({
          query_hash: queryHash,
          query_text: query,
          quote: minimal.quote,
          author: minimal.author,
          source: minimal.source,
          created_at: new Date().toISOString(),
        });
      } catch { /* ignore */ }

      return NextResponse.json(minimal, { status: 200 });
    }
    // 매치 없으면 아래 Genkit 폴백으로
  } catch {
    // 임베딩/벡터 검색 실패 → Genkit 폴백
  }

  // 5) Genkit(Cloud Run) 폴백 (모드 함께 전달)
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
    body: JSON.stringify({ input: query, mode }), // ★ 모드 전달
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

  try {
    await admin.from("quote_cache").upsert({
      query_hash: queryHash,
      query_text: query,
      quote: minimal.quote,
      author: minimal.author,
      source: minimal.source,
      created_at: new Date().toISOString(),
    });
  } catch { /* ignore */ }

  return NextResponse.json(minimal, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}