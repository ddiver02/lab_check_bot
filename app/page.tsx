"use client";

import { useEffect, useState } from "react";

type Mode = "harsh" | "comfort" | "random";
type MinimalQuote = { quote: string; author: string; source: string };

const MODE_LABELS: Record<Mode, string> = {
  harsh: "뼈맞기",
  comfort: "공감받기",
  random: "Random vibe",
};

const LOADING_TEXT: Record<Mode, string[]> = {
  harsh: [
    "😬 테스형이 쓴소리 준비 중…",
    "🪓 현실 직격탄 문장 고르는 중…",
    "⚡ 강한자만이 살아 남는다!",
    "🔥 오늘은 다 해낸다 모드로!",
  ],
  comfort: [
    "🤗 따뜻한 한마디 찾는 중…",
    "💖 넌 이 세상에서 최고야",
    "🌿 나 자신을 위한 시간이 되길",
    "☕ 차분한 공감의 구절 준비 중…",
  ],
  random: [
    "🎲 오늘의 vibe 뽑는 중…",
    "📚 또 알아? 각성할지?",
    "🌟 영감이 될 문장을 찾는 중…",
    "✨ 어쩌면 인생 문장을 찾을 지도?",
  ],
};

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("comfort");
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [res, setRes] = useState<MinimalQuote | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ⏱ 로딩 텍스트 랜덤 순환
  useEffect(() => {
    if (!loading) {
      setLoadingIdx(0);
      return;
    }
    const timer = setInterval(() => {
      const pool = LOADING_TEXT[mode];
      const randIdx = Math.floor(Math.random() * pool.length);
      setLoadingIdx(randIdx);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, mode]);

  async function onSubmit() {
    setErr(null);
    setRes(null);

    // 랜덤 모드는 입력이 비어도 OK → 기본 프롬프트로 치환
    const safeQuery =
      mode === "random" ? (text.trim() || "random vibe") : text.trim();

    if (mode !== "random" && !safeQuery) {
      setErr("문장을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: safeQuery, mode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "요청 실패");
      setRes(data as MinimalQuote);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <section className="space-y-8 max-w-3xl mx-auto px-4">
      {/* 헤드라인 */}
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold">한 문장을 선물드려요.</h1>
        <p className="mt-2 text-sm text-gray-700">
          ‘책 속에서 오늘의 대답을 찾는다’는 철학으로, <br />
          감정에 맞는 한 구절을 제안하는 인용구 추천 서비스입니다.
        </p>
      </div>

      {/* 모드 선택 */}
      <div className="w-full flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border bg-white p-1">
          {(["harsh", "comfort", "random"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={loading}
              className={[
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                mode === m
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              aria-pressed={mode === m}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="mt-1 text-xs text-gray-400 italic">
          {mode === "harsh" && "때론 아픈 진실이 성장의 시작이 됩니다."}
          {mode === "comfort" && "마음을 다독이는 따뜻한 위로를 전해줍니다."}
          {mode === "random" && "예상치 못한 문장에서 영감을 얻어보세요."}
        </div>
      </div>

      {/* 입력 + 버튼 */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            mode === "random"
              ? "입력 없이도 랜덤 vibe 가능 (예: 동기부여가 필요해)"
              : "예) 면접 앞두고 떨려서 잠이 안 와"
          }
          className="flex-1 rounded-lg border p-3 outline-none"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          disabled={loading}
          className="rounded-lg border px-4 py-2 min-w-20 disabled:opacity-60"
        >
          보내기
        </button>
      </div>

      {/* 상태 표시 */}
      {loading && (
        <div className="text-sm text-gray-700">
          {LOADING_TEXT[mode][loadingIdx]}
        </div>
      )}
      {err && <div className="text-sm text-red-600">⚠️ {err}</div>}

      {/* 결과 카드 */}
      {res && (
        <div className="mt-2 rounded-xl border p-5 bg-white">
          <blockquote className="text-lg leading-relaxed">
            “{res.quote}”
          </blockquote>
          <div className="mt-3 text-sm text-gray-600">
            — <span className="font-medium">{res.author}</span>
            {res.source ? (
              <span>
                {" "}
                · <em>{res.source}</em>
              </span>
            ) : null}
          </div>

          {/* 공유 버튼 */}
          <div className="mt-4">
            <button
              onClick={async () => {
                const shareText = `“${res.quote}” — ${res.author}${
                  res.source ? ` · ${res.source}` : ""
                }`;
                const shareUrl =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "";

                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "한 문장을 선물합니다",
                      text: shareText,
                      url: shareUrl,
                    });
                  } catch {
                    /* cancel */
                  }
                } else {
                  try {
                    await navigator.clipboard.writeText(
                      `${shareText}\n${shareUrl}`
                    );
                    alert("복사되었습니다. 원하는 곳에 붙여넣기 해주세요!");
                  } catch {
                    alert("복사 실패: 브라우저에서 허용되지 않았습니다.");
                  }
                }
              }}
              className="text-sm rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              책봍 링크 공유하기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}