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
    <div className="flex flex-col items-center gap-2 w-full">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          mode === "random"
            ? "예) 인생이란?"
            : "예) 나 잘 할 수 있을까?"
        }
        className="w-full p-3 outline-none border-b border-gray-300 focus:ring-0 focus:border-blue-500 shadow-sm transition-all duration-200 placeholder:text-center text-center"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        disabled={loading}
        className="text-[10] rounded-lg bg-blue-600 text-white px-4 py-2 min-w-10 disabled:opacity-60 hover:bg-blue-700 transition-colors duration-200 shadow-md"
      >
        보내기
      </button>
    </div>
  );
};

export default InputForm;