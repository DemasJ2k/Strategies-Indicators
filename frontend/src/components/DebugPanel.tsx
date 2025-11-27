import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function DebugPanel() {
  const result = useAgentStore((s) => s.result);
  const ctx = result?.context;

  if (!ctx) {
    return (
      <div className="p-4 bg-[#11131a] rounded">
        <h2 className="text-xl font-semibold">Debug</h2>
        <p className="text-sm text-gray-400">No analysis yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-4">
      <h2 className="text-xl font-semibold">Debug Mode</h2>

      {/* Context Flags */}
      <div>
        <h3 className="font-semibold mb-2">Context Flags</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(ctx).map(([k, v]) =>
            typeof v === 'boolean' ? (
              <div
                key={k}
                className={
                  'px-2 py-1 rounded ' +
                  (v
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-gray-700 text-gray-400')
                }
              >
                {k}: {v ? 'true' : 'false'}
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Raw Detector Data */}
      <div>
        <h3 className="font-semibold mb-2">Detector Outputs</h3>
        <pre className="bg-black p-3 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify((ctx as any).detectorOutput ?? ctx, null, 2)}
        </pre>
      </div>

      {/* Trade Plan Overlays */}
      {result?.tradePlan?.overlays && (
        <div>
          <h3 className="font-semibold mb-2">Overlays</h3>
          <pre className="bg-black p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(result.tradePlan.overlays, null, 2)}
          </pre>
        </div>
      )}

      {/* Classifier Signals */}
      {result.classification && (
        <div>
          <h3 className="font-semibold mb-2">Playbook Classifier</h3>
          <pre className="bg-black p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(result.classification, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
