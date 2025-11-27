import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function PlaybookScores() {
  const result = useAgentStore((s) => s.result);
  const scores = result?.classification?.scores;

  return (
    <div className="p-4 bg-[#11131a] rounded h-full">
      <h2 className="text-xl font-semibold mb-4">Playbook Scores</h2>
      {!scores && <p>No data</p>}
      {scores && (
        <div className="space-y-2">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span>{key}</span>
              <div className="flex-1 mx-4 bg-gray-800 h-2 rounded relative">
                <div
                  className="bg-blue-600 h-full rounded"
                  style={{ width: `${(value as number) * 100}%` }}
                />
              </div>
              <span>{((value as number) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
