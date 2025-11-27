import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function TradePlanView() {
  const result = useAgentStore((s) => s.result);
  const plan = result?.tradePlan;

  const primary = result?.classification?.primary;
  const bias = plan?.bias;
  const session = plan?.session;

  const entryType = plan?.entry?.type;
  const entryDesc = plan?.entry?.description || plan?.entry?.actionLine;

  const targetDesc = plan?.target?.description;
  const stopDesc = plan?.stop?.description;
  const invalidations: string[] = plan?.invalidations || [];

  return (
    <div className="p-4 bg-[#11131a] rounded h-full overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Trade Plan</h2>
      {!plan && <p className="text-sm text-gray-400">No trade plan yet.</p>}
      {plan && (
        <>
          <div className="mb-4 space-y-1 text-sm">
            <div>
              <span className="text-gray-400 mr-1">Playbook:</span>
              <span className="font-semibold">{plan.playbook}</span>
            </div>
            <div>
              <span className="text-gray-400 mr-1">Bias:</span>
              <span>{bias}</span>
            </div>
            <div>
              <span className="text-gray-400 mr-1">Session:</span>
              <span>{session}</span>
            </div>
            <div>
              <span className="text-gray-400 mr-1">Entry Type:</span>
              <span>{entryType}</span>
            </div>
            {entryDesc && (
              <div>
                <span className="text-gray-400 mr-1">Entry:</span>
                <span>{entryDesc}</span>
              </div>
            )}
            {targetDesc && (
              <div>
                <span className="text-gray-400 mr-1">Target:</span>
                <span>{targetDesc}</span>
              </div>
            )}
            {stopDesc && (
              <div>
                <span className="text-gray-400 mr-1">Stop:</span>
                <span>{stopDesc}</span>
              </div>
            )}
            {invalidations.length > 0 && (
              <div className="mt-1">
                <span className="text-gray-400 mr-1">Invalidations:</span>
                <ul className="list-disc list-inside text-xs text-gray-300">
                  {invalidations.map((inv, i) => (
                    <li key={i}>{inv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <pre className="text-xs bg-black p-4 rounded border border-gray-700 overflow-auto">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
