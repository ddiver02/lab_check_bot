"use client";
import React, { useEffect, useState } from 'react';
import { MinimalQuote } from "../types/app.d";

interface ResultCardProps {
  res: MinimalQuote | null;
}

const ResultCard: React.FC<ResultCardProps> = ({
  res
}) => {
  const [showReason, setShowReason] = useState(false);
  const [liked, setLiked] = useState(false);

  type FeedbackAction = 'like';
  type FeedbackBody = { action: FeedbackAction; quote_id: number; user_input_id?: number };

  function getQuoteId(q: MinimalQuote): number | undefined {
    if (typeof q.quote_id === 'number') return q.quote_id;
    const legacy = (q as Partial<{ id: number }>).id;
    return typeof legacy === 'number' ? legacy : undefined;
  }
  
  // 새 결과가 오면 좋아요 표시 초기화
  useEffect(() => {
    setLiked(false);
  }, [res?.quote_id, res?.quote, res?.author, res?.source]);

  if (!res) return null;

  async function sendFeedback(action: FeedbackAction) {
    try {
      const quoteId = res ? getQuoteId(res) : undefined;
      if (!quoteId) return; // nothing to send
      const payload: FeedbackBody = {
        action,
        quote_id: quoteId,
        user_input_id: res?.user_input_id,
      };
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Optional: lightweight UX hint
    } catch {
      // swallow to avoid blocking UI
    }
  }
  
  async function handleShare() {
    try {
      const title = "한 문장을 선물합니다";
      const shareText = `${res?.quote ?? ""}`;
      const shareAutor = `- ${res?.author ?? ""}${res?.source ? ` · 『${res.source}』` :""}`;
      const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
      const ctaText = "[하루 한 문장]";

      const payloadText = `${shareText}\n\n${shareAutor}`.trim();
      const restText = `${shareUrl} ${ctaText}`.trim();
      const payloadMarkdown = `${shareText}\n${title}\n\n[${ctaText}](${shareUrl})`.trim();

      if (navigator.share) {
        try {
          await navigator.share({
            title: payloadText,
            text: restText,
          });
        } catch {
          /* user canceled */
        }
      } else {
        try {
          await navigator.clipboard.writeText(payloadMarkdown);
          alert("복사되었습니다. 원하는 곳에 붙여넣기 해주세요!");
        } catch {
          alert("복사 실패: 브라우저에서 허용되지 않았습니다.");
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-2">
      <div className="quote-card border-none text-center">
        <img
          src="/quotoLogo.png"
          alt="문장의 발견 로고"
          className="mx-auto mb-3 h-8 w-auto"
        />
        {showReason && res.reason ? (
          <div className="quote-text whitespace-pre-wrap">{res.reason}</div>
        ) : (
          <blockquote className="quote-text leading-snug">&quot;{res.quote}&quot;</blockquote>
        )}
        <div className="quote-meta">
          — <span className="font-medium">{res.author}</span>
          {res.source ? (
            <span>
              {" "}
              · <em>『{res.source}』</em>
            </span>
          ) : null}
        </div>
        {/* 반응 아이콘 + 공유 + 추천 이유 토글 (좌측 정렬, 우측 링크) */}
        <div className="mt-10 flex items-center gap-2 w-full">
          <button
            aria-label="좋아요"
            title="좋아요"
            aria-pressed={liked}
            disabled={liked}
            className={`h-7 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-transparent px-2 text-gray-700 hover:bg-gray-100 ${liked ? 'opacity-60 cursor-default hover:bg-transparent' : ''}`}
            onClick={async () => {
              if (liked) return;
              await sendFeedback('like');
              setLiked(true);
            }}
          >
            <img
              src={liked ? "/heart_red.png" : "/heart.png"}
              alt=""
              aria-hidden
              className={`h-3.5 w-3.5 ${liked ? '' : 'grayscale opacity-40'}`}
            />
            <span className="text-xs">좋아요</span>
          </button>
          <button
            aria-label="공유"
            title="공유"
            className="h-7 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-transparent px-2 text-gray-700 hover:bg-gray-100"
            onClick={handleShare}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <circle cx="6" cy="12" r="2" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="16" cy="18" r="2" />
              <path d="M8 12l6-4" />
              <path d="M8 12l6 4" />
            </svg>
            <span className="text-xs">공유</span>
          </button>
          {res.reason ? (
            <button
              type="button"
              aria-label={showReason ? "문장으로 보기" : "추천 이유?"}
              title={showReason ? "문장으로 보기" : "추천 이유?"}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
              onClick={() => setShowReason((v) => !v)}
            >
              {showReason ? "문장 보기" : "추천 이유?"}
            </button>
          ) : null}
        </div>
      </div>
      {/* 3) 정보: [더 알아보기] */}
      <div className="mt-3 flex justify-center gap-3">
        {(() => {
          const author = res.author || "";
          const rawTitle = res.source || "";
          const titled = rawTitle ? `『${rawTitle}』` : "";
          const keyword = [author, titled]
            .filter(Boolean)
            .map((v) => encodeURIComponent(v))
            .join("+");
          const kyoboUrl = `https://search.kyobobook.co.kr/search?keyword=${keyword}&gbCode=TOT&target=total`;
          return (
            <a
              href={kyoboUrl}
              aria-label="더 알아보기"
              title="더 알아보기"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 inline-flex items-center justify-center rounded-md border bg-amber-50 px-5 text-sm text-gray-700 hover:bg-amber-100"
            >
              {rawTitle ? (
                <>
                  <em>『 {rawTitle} 』</em>&nbsp;&nbsp;더 알아보기
                </>
              ) : (
                "더 알아보기"
              )}
            </a>
          );
        })()}
        
      </div>
    </div>
  );
};export default ResultCard;
