"use client";
import React from 'react';
import { MinimalQuote } from "../types/app.d";

interface ResultCardProps {
  res: MinimalQuote | null;
}

const ResultCard: React.FC<ResultCardProps> = ({
  res
}) => {
  if (!res) return null;

  return (
    <div className="mt-2">
      <div className="quote-card border-none text-center">
        <img
          src="/quotoLogo.png"
          alt="문장의 발견 로고"
          className="mx-auto mb-3 h-8 w-auto"
        />
        <blockquote className="quote-text">
          『{res.quote}』
        </blockquote>
        <div className="quote-meta">
          — <span className="font-medium">{res.author}</span>
          {res.source ? (
            <span>
              {" "}
              · <em>{res.source}</em>
            </span>
          ) : null}
        </div>
      </div>

      {/* 공유 버튼 (미니멀 아이콘) */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          aria-label="공유하기"
          title="공유하기"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
          onClick={async () => {
            const title = "한 문장을 선물합니다";
            const shareText = `『${res.quote}』`;
            const shareAutor = `- ${res.author}${res.source ? ` · ${res.source}` :""}`;
            // CTA: 홈페이지로 유도하여 버튼 느낌의 링크 텍스트 제공
            const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
            const ctaText = "[문장의 발견]";

            // Web Share: 일반 텍스트 + URL
            const payloadText = `${shareText}\n\n${shareAutor}`.trim();
            const restText = `${shareUrl} ${ctaText}`.trim();
          
            // Clipboard: 마크다운 링크로 버튼처럼 보이게 (지원 플랫폼 한정)
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
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="6" cy="12" r="2" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="16" cy="18" r="2" />
            <path d="M8 12l6-4" />
            <path d="M8 12l6 4" />
          </svg>
        </button>
      </div>
    </div>
  );
};export default ResultCard;
