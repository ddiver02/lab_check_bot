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
  return (
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
  );
};

export default ModeSelector;