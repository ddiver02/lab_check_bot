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
  const modes: Mode[] = ["comfort", "random", "harsh"];
  const activeIdx = modes.indexOf(mode);
  const modeIcon: Record<Mode, string> = {
    harsh: "/broken_bone.png",
    random: "/surprise.png",
    comfort: "/helping.png",
  };

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
              "relative z-10 rounded-full px-6 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 inline-flex items-center justify-center",
              mode === m ? "text-gray-900" : "hover:text-gray-800",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <img
              src={modeIcon[m]}
              alt={MODE_LABELS[m]}
              className="h-10 w-10 gap-4"
            />
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-700 text-center">
        {mode === "harsh" && "뼈맞기: 때론 아픈 진실이 성장의 시작이 됩니다."}
        {mode === "comfort" && "공감: 마음을 다독이는 따뜻한 위로를 전해줍니다."}
        {mode === "random" && "랜덤: 예상치 못한 문장에서 영감을 얻어보세요."}
      </div>
    </div>
  );
};

export default ModeSelector;
