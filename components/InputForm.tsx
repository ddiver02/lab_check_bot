import React from 'react';
import { Mode } from "../types/app.d";

interface InputFormProps {
  text: string;
  setText: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  mode: Mode;
}

const InputForm: React.FC<InputFormProps> = ({
  text,
  setText,
  onKeyDown,
  onSubmit,
  loading,
  mode,
}) => {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            mode === "random"
              ? "예) 인생이란?"
              : "예) 나 잘 할 수 있을까?"
          }
          className="w-full bg-transparent py-3 pl-3 pr-12 border-b border-gray-300 focus:border-gray-900 outline-none transition-colors duration-150 placeholder:text-gray-400 text-gray-900 placeholder:text-center text-center"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-60 transition-colors duration-150 shadow-none"
          aria-label="보내기"
          title="보내기"
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
            <path d="M5 12h10" />
            <path d="M13 8l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InputForm;
