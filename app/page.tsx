"use client";
import { useEffect, useRef, useState } from "react";

type MinimalQuote = { quote: string; author: string; source: string };

const FUN_LOADINGS = [
  "테스형에게 물어보는 중…",
  "책장을 넘기는 소리… 📖",
  "문장 사이를 산책합니다…",
  "좋은 말 꺼내오는 중… ✨",
  "글 사이에 숨은 위로 탐색 중…",
  "마음 온도 조절 중… 🌡️",
  "오늘의 문장 섭외 중…",
  "종이 냄새 맡는 중… 📚",
];

export default function Home() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<MinimalQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string>(FUN_LOADINGS[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 로딩 멘트 랜덤 갱신
  useEffect(() => {
    if (!loading) return;
    const tick = () => {
      const next = FUN_LOADINGS[Math.floor(Math.random() * FUN_LOADINGS.length)];
      setLoadingMsg(next);
    };
    tick();
    const id = setInterval(tick, 1600);
    return () => clearInterval(id);
  }, [loading]);

  async function handleSend() {
    const q = text.trim();
    if (!q || loading) return;

    setErrMsg(null);
    setToast(null);
    setReply(null);
    setLoading(true);

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `요청 실패 (${res.status})`);
      }
      setReply(data as MinimalQuote);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleShare() {
  if (!reply) return;

  // 현재 배포/로컬에 맞춰 자동으로 origin을 잡음
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://checkbot-web.vercel.app";

  // 추적이 필요하면 UTM 파라미터를 추천 (선택)
  const shareUrl = `${origin}/?ref=share`;

  const shareText = `“${reply.quote}” — ${reply.author} · ${reply.source}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "오늘의 문장",
        text: shareText,
        url: shareUrl, // ← URL 포함!
      });
      setToast("✅ 공유했어요!");
    } else {
      // 폴백: 텍스트 + URL을 함께 복사
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setToast("✅ 복사했어요. 원하는 곳에 붙여넣기!");
    }
  } catch {
    setToast("공유를 취소했어요.");
  } finally {
    setTimeout(() => setToast(null), 1600);
  }
}
  return (
    <section className="mx-auto max-w-2xl p-6 space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 p-10 text-center">
        <h1 className="text-2xl font-bold">테스형에게 물어봐</h1>
        <p className="mt-2 text-sm">한 줄로 마음을 적으면, 어울리는 문장을 찾아드려요.</p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="예) 면접 앞두고 떨려서 잠이 안 와"
          className="flex-1 rounded-lg border p-3 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !text.trim()}
          className={`rounded-lg border px-4 py-2 transition ${
            loading || !text.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          {loading ? "찾는 중…" : "보내기"}
        </button>
      </div>

      {/* Loading / Error / Hint / Toast */}
      {loading && (
        <div className="text-sm text-gray-600">{loadingMsg}</div>
      )}
      {errMsg && (
        <div className="text-sm text-red-600">⚠️ {errMsg}</div>
      )}
      {toast && (
        <div className="text-sm text-green-600">{toast}</div>
      )}
      {!loading && !reply && !errMsg && !toast && (
        <div className="text-xs text-gray-500">
          ⌨️ <b>Enter</b>로 보내기 / <b>Shift+Enter</b>로 줄바꿈  {/** {💥외워!} */}
        </div>
      )}

      {/* Result Card */}
      {reply && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <blockquote className="text-[20px] leading-relaxed">
            “{reply.quote}”
          </blockquote>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">— {reply.author}</span>
              <span className="text-gray-500"> · <i>{reply.source}</i></span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="rounded-md border px-3 py-1 hover:bg-gray-50 text-sm"
              >
                공유하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}