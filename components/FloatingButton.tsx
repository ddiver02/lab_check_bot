"use client";
import React from "react";

const FloatingButton: React.FC = () => {
  // Hardcoded redirect URL
  const href = "https://docs.google.com/forms/d/e/1FAIpQLSdslKYusOwWJ7ELjvD81MYe5dxXQSWpYQDodLICE4adxTlwQg/viewform?usp=header";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="의견 보내기"
        title="의견 보내기"
        className="h-14 w-14 rounded-full text-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <img src="/bot_fav.png" alt="의견 보내기" className="h-8 w-8" />
      </a>
      <span className="text-xs text-gray-700">더그리 밥주기</span>
    </div>
  );
};

export default FloatingButton;
