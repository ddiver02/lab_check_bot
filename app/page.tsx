"use client";

import { useEffect, useState } from "react";

import { Mode, MinimalQuote } from "../types/app.d";
import { MODE_LABELS, LOADING_TEXT } from "../lib/constants";
import { fetchQuote } from "../lib/api";
import Headline from "../components/Headline";
import ModeSelector from "../components/ModeSelector";
import InputForm from "../components/InputForm";
import StatusDisplay from "../components/StatusDisplay";
import ResultCard from "../components/ResultCard";

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
      const data = await fetchQuote(safeQuery, mode);
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
      <Headline />

      {/* 모드 선택 */}
      <ModeSelector mode={mode} setMode={setMode} loading={loading} />

      {/* 입력 + 버튼 */}
      <InputForm
        text={text}
        setText={setText}
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
        loading={loading}
        mode={mode}
      />

      {/* 상태 표시 */}
      <StatusDisplay loading={loading} loadingIdx={loadingIdx} mode={mode} err={err} />

      {/* 결과 카드 */}
      <ResultCard res={res} />
    </section>
  );
}