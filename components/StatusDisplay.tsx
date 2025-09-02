import React from 'react';
import { Mode } from "../types/app.d";
import { LOADING_TEXT } from "../lib/constants";

interface StatusDisplayProps {
  loading: boolean;
  loadingIdx: number;
  mode: Mode;
  err: string | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  loading,
  loadingIdx,
  mode,
  err,
}) => {
  return (
    <>
      {loading && (
        <div className="text-sm text-gray-700 text-center">
          {LOADING_TEXT[mode][loadingIdx]}
        </div>
      )}
      {err && <div className="text-sm text-red-600">⚠️ {err}</div>}
    </>
  );
};

export default StatusDisplay;
