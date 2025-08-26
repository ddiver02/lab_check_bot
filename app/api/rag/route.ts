// app/api/rag/route.ts
export const runtime = "nodejs";                 // Edge 아님
export const preferredRegion = ["icn1", "hnd1"]; // 서울/도쿄 우선

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";

type CandidateRow = {
  id: number;
  quote: string;
  author: string;
  source: string;
  similarity: number;
};

type Mode = "harsh" | "comfort" | "random";
type RagRequest = { query?: string; mode?: Mode };
type MinimalQuote = { quote: string; author: string; source: string };

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function hashQuery(query: string, mode: Mode) {
  return crypto.createHash("sha256").update(`${mode}|${query}`).digest("hex");
}

const CACHE_TTL_DAYS = 7;

// 매칭 파라미터 (완화)
const VECTOR_THRESHOLD = 0.65; // ↓ 완화해서 매칭률 ↑
const VECTOR_TOP_K = 3;

// 랜덤 1개 가져오기 (fallback/랜덤모드 공용)
async function fetchRandomQuote() {
  const admin = getSupabaseAdmin();

  // 총 개수 확인
  const { count, error: cntErr } = await admin
    .from("quote_embeddings")
    .select("id", { count: "exact", head: true });

  if (cntErr || !count || count <= 0) {
    throw new Error("No quotes available in DB.");
  }

  // 0..count-1 중 임의 offset
  const offset = Math.floor(Math.random() * count);

  // offset에서 1개만 조회
  const { data, error } = await admin
    .from("quote_embeddings")
    .select("quote, author, source")
    .range(offset, offset); // LIMIT 1 with offset

  if (error || !data || data.length === 0) {
    throw new Error("Failed to fetch random quote.");
  }

  const row = data[0];
  const minimal: MinimalQuote = {
    quote: row.quote,
    author: row.author,
    source: row.source,
  };
  return minimal;
}

// ─────────────────────────────────────────────
// 핸들러
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  // 0) 요청 파싱
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (bodyUnknown ?? {}) as RagRequest;
  const mode: Mode = raw.mode ?? "comfort";

  // random 모드는 빈 문자열 허용 → 기본 프롬프트로 치환
  let query = (raw.query ?? "").trim();
  if (mode === "random" && !query) {
    query = "random vibe";
  }

  // 나머지 모드는 비어 있으면 에러
  if (mode !== "random" && !query) {
    return NextResponse.json(
      { error: "Invalid request: 'query' must be a non-empty string." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // 1) 캐시 조회 (모드+질의 키)
  const queryHash = hashQuery(query, mode);
  try {
    const { data: cached, error: cacheErr } = await admin
      .from("quote_cache")
      .select("quote, author, source, created_at")
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (!cacheErr && cached) {
      const createdAt = new Date(cached.created_at);
      const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < CACHE_TTL_DAYS) {
        const minimal: MinimalQuote = {
          quote: cached.quote,
          author: cached.author,
          source: cached.source,
        };
        return NextResponse.json(minimal, { status: 200 });
      }
      // 만료면 계속 진행
    }
  } catch {
    // 캐시 조회 실패해도 진행
  }

  // 2) 질의 로그 (best-effort)
  try {
    await admin.from("messages").insert({ content: mode === "random" ? "[RANDOM]" : query });
  } catch { /* ignore */ }

  // 3) 랜덤 모드 → DB에서 바로 랜덤 1개 (Cloud Run/Genkit 호출 없음)
  if (mode === "random") {
    try {
      const minimal = await fetchRandomQuote();
      // 캐시 저장
      try {
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // 4) 벡터 유사도 검색 (harsh/comfort)
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    const embedder = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const emb = await embedder.embedContent(query);
    const queryVec = emb.embedding.values;

    let matches: CandidateRow[] | null = null;

    // 1차: match_quotes
    const m1 = await admin.rpc("match_quotes", {
      query_embedding: queryVec,
      match_threshold: VECTOR_THRESHOLD,
      match_count: VECTOR_TOP_K,
    });
    if (!m1.error && Array.isArray(m1.data)) {
      matches = m1.data as CandidateRow[];
    } else {
      // 2차: match_quote_embeddings (환경별 이름 다를 수 있음)
      const m2 = await admin.rpc("match_quote_embeddings", {
        query_embedding: queryVec,
        match_threshold: VECTOR_THRESHOLD,
        match_count: VECTOR_TOP_K,
      });
      if (!m2.error && Array.isArray(m2.data)) {
        matches = m2.data as CandidateRow[];
      }
    }

    if (matches && matches.length > 0) {
      const top = matches[0];
      const minimal: MinimalQuote = {
        quote: top.quote,
        author: top.author,
        source: top.source,
      };

      // 캐시 저장
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
  } catch {
    // 임베딩/벡터 검색 실패 → 아래 랜덤 폴백
  }

  // 5) 최종 폴백: DB 랜덤 1개 (Genkit 호출 제거 → timeout 방지)
  try {
    const minimal = await fetchRandomQuote();
    // 캐시 저장
    try {
      await admin.from("quote_cache").upsert({
        query_hash: queryHash,
        query_text: "[FALLBACK_RANDOM]",
        quote: minimal.quote,
        author: minimal.author,
        source: minimal.source,
        created_at: new Date().toISOString(),
      });
    } catch { /* ignore */ }
    return NextResponse.json(minimal, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}