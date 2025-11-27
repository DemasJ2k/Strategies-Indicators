import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function TradePlanView() {
  const result = useAgentStore((s) => s.result);
  const plan = result?.tradePlan;

  return (
    <div className="p-4 bg-[#11131a] rounded h-full overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Trade Plan</h2>
      {!plan && <p>No trade plan yet</p>}
      {plan && (
        <pre className="text-sm bg-black p-4 rounded border border-gray-700 overflow-auto">
          {JSON.stringify(plan, null, 2)}
        </pre>
      )}
    </div>
  );
}
