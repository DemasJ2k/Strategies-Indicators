import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function ErrorBanner() {
  const error = useAgentStore((s) => s.error);
  const setError = useAgentStore((s) => s.setError);

  if (!error) return null;

  return (
    <div className="p-3 bg-red-600/20 border border-red-500/40 text-red-300 rounded mb-4">
      <div className="flex justify-between items-center">
        <span>{error}</span>
        <button onClick={() => setError(null)} className="text-lg font-bold hover:text-red-100">
          ×
        </button>
      </div>
    </div>
  );
}
