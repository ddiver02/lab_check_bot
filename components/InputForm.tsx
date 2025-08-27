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
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          mode === "random"
            ? "예) 인생이란?"
            : "예) 나 잘 할 수 있을까?"
        }
        className="flex-1 rounded-lg border p-3 outline-none"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        disabled={loading}
        className="rounded-lg border px-4 py-2 min-w-20 disabled:opacity-60"
      >
        보내기
      </button>
    </div>
  );
};

export default InputForm;