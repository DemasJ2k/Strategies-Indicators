import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

export default function SettingsPanel() {
  const settings = useAgentStore((s) => s.settings);
  const risk = useAgentStore((s) => s.risk);
  const setSettings = useAgentStore((s) => s.setSettings);
  const setRisk = useAgentStore((s) => s.setRisk);

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Playbook Toggles */}
      <div>
        <h3 className="font-semibold mb-2">Playbooks</h3>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(settings).map(([pb, cfg]) => (
            <div key={pb} className="bg-black/40 p-3 rounded">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) =>
                    setSettings({
                      [pb]: { ...cfg, enabled: e.target.checked },
                    } as any)
                  }
                />
                <span>{pb}</span>
              </label>

              {/* Quick settings per playbook */}
              <div className="mt-2 text-xs text-gray-400 space-y-1">
                {pb === 'NBB' && (
                  <>
                    <label>ADR Max %</label>
                    <input
                      type="number"
                      value={cfg.adrMaxPct}
                      onChange={(e) =>
                        setSettings({
                          NBB: { ...cfg, adrMaxPct: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1 rounded bg-gray-800 text-gray-200"
                    />
                  </>
                )}

                {pb === 'TORI' && (
                  <>
                    <label>Min Trendline Touches</label>
                    <input
                      type="number"
                      value={cfg.minTouches}
                      onChange={(e) =>
                        setSettings({
                          TORI: { ...cfg, minTouches: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1 rounded bg-gray-800 text-gray-200"
                    />
                  </>
                )}

                {pb === 'FABIO' && (
                  <>
                    <label>Imbalance Threshold</label>
                    <input
                      type="number"
                      value={cfg.imbalanceThreshold}
                      onChange={(e) =>
                        setSettings({
                          FABIO: {
                            ...cfg,
                            imbalanceThreshold: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full p-1 rounded bg-gray-800 text-gray-200"
                    />
                  </>
                )}

                {pb === 'JADE' && (
                  <>
                    <label>Intraday Start</label>
                    <input
                      type="number"
                      value={cfg.intradayStartHour}
                      onChange={(e) =>
                        setSettings({
                          JADE: {
                            ...cfg,
                            intradayStartHour: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full p-1 rounded bg-gray-800 text-gray-200"
                    />

                    <label>Intraday End</label>
                    <input
                      type="number"
                      value={cfg.intradayEndHour}
                      onChange={(e) =>
                        setSettings({
                          JADE: {
                            ...cfg,
                            intradayEndHour: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full p-1 rounded bg-gray-800 text-gray-200"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Settings */}
      <div>
        <h3 className="font-semibold mb-2">Risk</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label>Risk Per Trade (%)</label>
            <input
              type="number"
              value={risk.riskPercent}
              onChange={(e) =>
                setRisk({ riskPercent: Number(e.target.value) })
              }
              className="w-full p-2 rounded bg-gray-800 text-gray-200"
            />
          </div>

          <div>
            <label>Max Daily Trades</label>
            <input
              type="number"
              value={risk.maxDailyTrades}
              onChange={(e) =>
                setRisk({ maxDailyTrades: Number(e.target.value) })
              }
              className="w-full p-2 rounded bg-gray-800 text-gray-200"
            />
          </div>
        </div>

        <div className="mt-2">
          <label>RR Targets</label>
          <input
            type="text"
            value={risk.rrTargets.join(',')}
            onChange={(e) =>
              setRisk({
                rrTargets: e.target.value.split(',').map(Number),
              })
            }
            className="w-full p-2 rounded bg-gray-800 text-gray-200"
          />
          <p className="text-xs text-gray-500 mt-1">Example: 1,2,4</p>
        </div>
      </div>
    </div>
  );
}
