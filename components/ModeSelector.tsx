import React from 'react';
import { Mode } from "../types/app.d";
import { MODE_LABELS } from "../lib/constants";

interface ModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  loading: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  setMode,
  loading,
}) => {
  const modes: Mode[] = ["harsh", "random", "comfort"];
  const activeIdx = modes.indexOf(mode);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div
        role="tablist"
        aria-label="문장 모드 선택"
        className="relative inline-grid grid-cols-3 rounded-full bg-gray-100 p-1 ring-1 ring-gray-200"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-1 top-1 bottom-1 z-0 w-1/3 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: `translateX(${activeIdx * 100}%)` }}
        />
        {modes.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            disabled={loading}
            className={[
              "relative z-10 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              mode === m ? "text-gray-900" : "hover:text-gray-800",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400 text-center">
        {mode === "harsh" && "때론 아픈 진실이 성장의 시작이 됩니다."}
        {mode === "comfort" && "마음을 다독이는 따뜻한 위로를 전해줍니다."}
        {mode === "random" && "예상치 못한 문장에서 영감을 얻어보세요."}
      </div>
    </div>
  );
};

export default ModeSelector;
