// app/api/rag/route.ts
export const runtime = "nodejs";                 // Edge 아님
export const preferredRegion = ["icn1", "hnd1"]; // 서울/도쿄 우선

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverEnv } from "@/lib/runtimeEnv";

type CandidateRow = {
  id: number;
  quote: string;
  author: string;
  source: string;
  similarity: number;
};

type Mode = "harsh" | "comfort" | "random";
type RagRequest = { query?: string; mode?: Mode };
type MinimalQuote = {
  quote: string;
  author: string;
  source: string;
  quote_id?: number;
  user_input_id?: number;
  similarity?: number;
  reason?: string;
};
type MinimalQuoteWithId = MinimalQuote & { id: number };

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
// Note: caching disabled — always compute fresh results

// 매칭 파라미터 (하드코딩)
const VECTOR_THRESHOLD = 0.55; // 유사도 임계값(낮을수록 후보↑)
const VECTOR_TOP_K = 5;        // 상위 후보 개수
// 결과 다양성 제어용 샘플링 온도 (낮을수록 1위에 집중, 높을수록 다양성↑)
const SAMPLING_TEMPERATURE = 0.35;

// Random 모드 전용(입력이 있을 때 느슨하게 영감/인사이트 위주 매칭)
const RANDOM_VECTOR_THRESHOLD = 0.5; // 일반보다 더 완화
const RANDOM_VECTOR_TOP_K = 5;       // 후보 더 넓게
const RANDOM_SAMPLING_TEMPERATURE = 0.7; // 다양성↑

function pickFromTopK(cands: CandidateRow[], temp: number): CandidateRow {
  if (!Array.isArray(cands) || cands.length === 0) throw new Error("empty candidates");
  if (cands.length === 1) return cands[0];
  // similarity 기반 softmax 가중 샘플링
  const sims = cands.map((c) => (typeof c.similarity === 'number' ? c.similarity : 0));
  const maxSim = Math.max(...sims);
  if (!Number.isFinite(temp) || temp <= 0) return cands[0];
  const exps = sims.map((s) => Math.exp((s - maxSim) / temp));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * sum;
  for (let i = 0; i < exps.length; i++) {
    r -= exps[i];
    if (r <= 0) return cands[i];
  }
  return cands[cands.length - 1];
}

// 랜덤 1개 가져오기 (fallback/랜덤모드 공용)
async function fetchRandomQuote(): Promise<MinimalQuoteWithId> {
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
    .select("id, quote, author, source")
    .range(offset, offset); // LIMIT 1 with offset

  if (error || !data || data.length === 0) {
    throw new Error("Failed to fetch random quote.");
  }

  const row = data[0];
  const minimal: MinimalQuoteWithId = {
    id: row.id as number,
    quote: row.quote,
    author: row.author,
    source: row.source,
  };
  return minimal;
}

// 최종 결과 확보 후 상호작용 로그 (필수 컬럼 모두 채워서 insert)
async function logInputAndInteraction(
  admin: ReturnType<typeof getSupabaseAdmin>,
  params: { user_input: string; selected_mode: Mode; quote_id: number }
): Promise<{ user_input_id?: number }> {
  try {
    const { data: ui, error: uiErr } = await admin
      .from("user_input")
      .insert({
        input_text: params.user_input,
        selected_mode: params.selected_mode,
      })
      .select("id")
      .single();

    const user_input_id = ui?.id as number | undefined;

    // Best effort interaction log
    await admin.from("user_interactions").insert({
      input_text: params.user_input,
      selected_mode: params.selected_mode,
      quote_id: params.quote_id,
    });

    if (uiErr) {
      if (process.env.DEV_LOG_DB === "1") console.error("user_input insert failed", uiErr);
    }
    return { user_input_id };
  } catch (e) {
    if (process.env.DEV_LOG_DB === "1") {
      console.error("DB insert (user_input/user_interactions) failed", e);
    }
    return {};
  }
}

// 추천 이유 저장 (있으면 기록; 실패는 무시)
async function saveRecommendationReason(
  admin: ReturnType<typeof getSupabaseAdmin>,
  params: { user_input_id?: number; quote_id: number; reason?: string; similarity?: number }
) {
  try {
    if (!params.user_input_id) return; // user_input insert가 실패한 경우 skip
    await admin.from("user_recommendations").insert({
      user_input_id: params.user_input_id,
      quote_id: params.quote_id,
      reason: params.reason ?? null,
      similarity: typeof params.similarity === "number" ? params.similarity : null,
    });
  } catch (e) {
    if (process.env.DEV_LOG_DB === "1") {
      console.error("DB insert (user_recommendations) failed", e);
    }
  }
}

// 추천 직후, 반응 미선택 상태를 NULL로 기록 (있어도 실패 무시)
async function saveFeedbackPlaceholder(
  admin: ReturnType<typeof getSupabaseAdmin>,
  params: { user_input_id?: number; quote_id: number }
) {
  try {
    if (!params.user_input_id) return;
    await admin.from('user_feedback').insert({
      user_input_id: params.user_input_id,
      quote_id: params.quote_id,
      action: 'none',
    });
  } catch (e) {
    if (process.env.DEV_LOG_DB === "1") {
      console.error('DB insert (user_feedback placeholder) failed', e);
    }
  }
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

  // random 모드는 빈 문자열 허용 → 기본 프롬프트로 치환 (표시/로그용)
  const hadQuery = !!(raw.query && String(raw.query).trim());
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

  // 0.5) 서버 필수 env 검증 (명확한 에러 반환)
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: msg,
        hint: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
      },
      { status: 500 }
    );
  }

  // 1) 캐시 조회 제거: 항상 최신 결과 계산

  // 2) 질의 로그는 최종 결과가 확정된 뒤에 user_interactions로 기록

  // 3) 랜덤 모드
  if (mode === "random") {
    // 입력이 있으면: 느슨한 임계 + 상위 더 넓게 + 가중 샘플링으로 영감/인사이트 위주 선택
    if (hadQuery) {
      try {
        const { googleApiKey } = serverEnv();
        if (!googleApiKey) throw new Error("Missing GOOGLE_API_KEY (PROD_/STG_)\n");

        const genAI = new GoogleGenerativeAI(googleApiKey);
        const embedder = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const emb = await embedder.embedContent(query);
        const queryVec = emb.embedding.values;

        let matches: CandidateRow[] | null = null;
        const m1 = await admin.rpc("match_quotes", {
          query_embedding: queryVec,
          match_threshold: RANDOM_VECTOR_THRESHOLD,
          match_count: RANDOM_VECTOR_TOP_K,
        });
        if (!m1.error && Array.isArray(m1.data)) {
          matches = m1.data as CandidateRow[];
        } else {
          const m2 = await admin.rpc("match_quote_embeddings", {
            query_embedding: queryVec,
            match_threshold: RANDOM_VECTOR_THRESHOLD,
            match_count: RANDOM_VECTOR_TOP_K,
          });
          if (!m2.error && Array.isArray(m2.data)) {
            matches = m2.data as CandidateRow[];
          }
        }

        if (matches && matches.length > 0) {
          const topK = matches.slice(0, RANDOM_VECTOR_TOP_K);
          const picked = pickFromTopK(topK, RANDOM_SAMPLING_TEMPERATURE);

          const { user_input_id } = await logInputAndInteraction(admin, {
            user_input: query,
            selected_mode: mode,
            quote_id: picked.id,
          });

          // 한 문장 이유 생성 (영감/인사이트 톤)
          let reason: string | undefined;
          try {
            const gen = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = [
              "사용자 입력을 바탕으로 인사이트/영감을 줄 수 있는 연결을 한국어 한 문장으로만 설명하세요.",
              "규칙:",
              "- 문장 1개, 24~90자.",
              "- 머릿글, 줄바꿈, 따옴표 금지.",
              "- 담백하고 친근한 어조.",
              "",
              `사용자 입력: "${query}"`,
              `인용문: "${picked.quote}" — ${picked.author}${picked.source ? `, 『${picked.source}』` : ""}`,
            ].join("\n");
            const out = await gen.generateContent(prompt);
            const txt = out.response.text().trim();
            const line = (txt.split(/\r?\n/)[0] || txt).trim()
              .replace(/^[-*•\s]+/, "")
              .replace(/^\"|\"$/g, "");
            const clip = (s: string) => s.slice(0, 140);
            reason = clip(line);
          } catch {}

          const payload: MinimalQuote = {
            quote: picked.quote,
            author: picked.author,
            source: picked.source,
            quote_id: picked.id,
            user_input_id,
            similarity: typeof picked.similarity === "number" ? picked.similarity : undefined,
            reason,
          };
          await saveRecommendationReason(admin, {
            user_input_id,
            quote_id: picked.id,
            reason,
            similarity: payload.similarity,
          });
          // no placeholder write; only record if user taps like
          return NextResponse.json(payload, { status: 200 });
        }
      } catch {
        // 아래 무작위 폴백으로 진행
      }
    }

    // 입력이 없거나 매칭 실패 → DB에서 무작위 1개 선택
    try {
      const minimal = await fetchRandomQuote();
      // 캐시 저장 제거
      // 최종 결과 확보 후 상호작용 로그
      const { user_input_id } = await logInputAndInteraction(admin, {
        user_input: (raw.query ?? "").trim() || "[RANDOM]",
        selected_mode: mode,
        quote_id: minimal.id,
      });
      const response: MinimalQuote = {
        quote: minimal.quote,
        author: minimal.author,
        source: minimal.source,
        quote_id: minimal.id,
        user_input_id,
        reason: hadQuery
          ? "직접 매칭이 어려워 가벼운 영감으로 제안드려요."
          : "영감을 위한 무작위 추천으로, 열린 마음으로 읽어보세요.",
      };
      // 이유 로그 저장
      await saveRecommendationReason(admin, {
        user_input_id,
        quote_id: minimal.id,
        reason: response.reason,
      });
      // no placeholder write; only record if user taps like
      return NextResponse.json(response, { status: 200 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // 4) 벡터 유사도 검색 (harsh/comfort)
  try {
    const { googleApiKey } = serverEnv();
    if (!googleApiKey) throw new Error("Missing GOOGLE_API_KEY (PROD_/STG_)");

    const genAI = new GoogleGenerativeAI(googleApiKey);
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
      // 상위 K 후보 중 softmax 가중 샘플링으로 1개 선택
      const topK = matches.slice(0, VECTOR_TOP_K);
      const top = pickFromTopK(topK, SAMPLING_TEMPERATURE);
      const { user_input_id } = await logInputAndInteraction(admin, {
        user_input: query,
        selected_mode: mode,
        quote_id: top.id,
      });
      // 간단한 이유 생성 (Gemini) - 한 문장 자연스러운 설명
      let reason: string | undefined;
      try {
        const gen = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = [
          "다음 정보를 바탕으로 추천 이유를 한국어 한 문장으로만 작성하세요.",
          "규칙:",
          "- 문장 1개, 24~90자.",
          "- 머릿글(의도:, 해석 포인트:), 줄바꿈, 따옴표 금지.",
          "- 사용자의 의도 요약과 인용문의 해석 포인트를 자연스럽게 한 문장에 녹이기.",
          "- 과장/추가 사실 금지, 입력과 인용문에서만 추론.",
          "",
          `사용자 입력: "${query}"`,
          `인용문: "${top.quote}" — ${top.author}${top.source ? `, 『${top.source}』` : ""}`,
        ].join("\n");
        const out = await gen.generateContent(prompt);
        const txt = out.response.text().trim();
        const line = (txt.split(/\r?\n/)[0] || txt).trim()
          .replace(/^[-*•\s]+/, "")
          .replace(/^\"|\"$/g, "");
        const clip = (s: string) => s.slice(0, 140);
        reason = clip(line);
      } catch {
        // ignore reason failure
      }

      const minimal: MinimalQuote = {
        quote: top.quote,
        author: top.author,
        source: top.source,
        quote_id: top.id,
        user_input_id,
        similarity: typeof top.similarity === "number" ? top.similarity : undefined,
        reason,
      };
      // 이유 로그 저장
      await saveRecommendationReason(admin, {
        user_input_id,
        quote_id: top.id,
        reason,
        similarity: minimal.similarity,
      });
      // no placeholder write; only record if user taps like
      return NextResponse.json(minimal, { status: 200 });
    }
  } catch {
    // 임베딩/벡터 검색 실패 → 아래 랜덤 폴백
  }

  // 5) 최종 폴백: DB 랜덤 1개 (Genkit 호출 제거 → timeout 방지)
  try {
    const minimal = await fetchRandomQuote();
    const { user_input_id } = await logInputAndInteraction(admin, {
      user_input: query,
      selected_mode: mode,
      quote_id: minimal.id,
    });
    const response: MinimalQuote = {
      quote: minimal.quote,
      author: minimal.author,
      source: minimal.source,
      quote_id: minimal.id,
      user_input_id,
      reason: "유사도 매칭이 어려워 가벼운 영감으로 제안드려요.",
    };
    await saveRecommendationReason(admin, {
      user_input_id,
      quote_id: minimal.id,
      reason: response.reason,
    });
    // no placeholder write; only record if user taps like
    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
