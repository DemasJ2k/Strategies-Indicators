import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function PlaybookScores() {
  const result = useAgentStore((s) => s.result);

  const scores = result?.classification?.scores;
  const primary = result?.classification?.primary;
  const backup = result?.classification?.backup;

  return (
    <div className="p-4 bg-[#11131a] rounded h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Playbook Scores</h2>
        {result && (
          <span className="text-xs text-gray-400">
            {result.context?.session} · {result.context?.htfBias || 'NO BIAS'}
          </span>
        )}
      </div>
      {!scores && <p className="text-sm text-gray-400">No data yet.</p>}
      {scores && (
        <>
          <div className="mb-4">
            <div className="text-sm">
              <span className="text-gray-400 mr-2">Primary:</span>
              <span className="font-semibold">{primary || 'NONE'}</span>
            </div>
            {backup && (
              <div className="text-sm">
                <span className="text-gray-400 mr-2">Backup:</span>
                <span>{backup}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm">{key}</span>
                <div className="flex-1 mx-4 bg-gray-800 h-2 rounded relative">
                  <div
                    className="bg-blue-600 h-full rounded"
                    style={{ width: `${(value as number) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-300 w-12 text-right">
                  {((value as number) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
