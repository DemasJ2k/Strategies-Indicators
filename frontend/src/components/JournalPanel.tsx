import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';

interface Trade {
  id: string;
  symbol: string;
  instrument: string;
  direction: string;
  playbook: string;
  entry_time: string;
  exit_time?: string;
  entry_price: number;
  exit_price?: number;
  size: number;
  pnl?: number;
  rr?: number;
  status: string;
  session?: string;
  notes?: string;
}

export default function JournalPanel() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const setError = useAgentStore((s) => s.setError);
  const result = useAgentStore((s) => s.result);

  async function loadTrades() {
    try {
      setLoading(true);
      const res = await fetch('/api/journal/trades?limit=50');
      const json = await res.json();
      setTrades(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrades();
  }, []);

  async function createTradeFromSignal() {
    if (!result?.signal) return;
    const s = result.signal;

    const payload = {
      signalId: (result as any).signalId,
      symbol: s.symbol,
      instrument: s.instrument,
      direction: s.direction,
      playbook: s.playbook,
      entryTime: new Date().toISOString(),
      entryPrice: result.context?.lastPrice || 0,
      size: 1, // you can expose this input later
      status: 'open',
      session: result.context?.session,
      notes: '',
    };

    const res = await fetch('/api/journal/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const newTrade = await res.json();
    setTrades((prev) => [newTrade, ...prev]);
  }

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Trading Journal</h2>
        <button
          onClick={createTradeFromSignal}
          disabled={!result?.signal}
          className="px-3 py-1 bg-emerald-600 rounded text-xs disabled:opacity-50"
        >
          Log Trade from Current Signal
        </button>
      </div>

      {loading && <p className="text-xs text-gray-400">Loading...</p>}

      {trades.length === 0 && !loading && (
        <p className="text-xs text-gray-400">No trades logged yet.</p>
      )}

      {trades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-1 pr-2">Symbol</th>
                <th className="py-1 pr-2">Dir</th>
                <th className="py-1 pr-2">Playbook</th>
                <th className="py-1 pr-2">Entry</th>
                <th className="py-1 pr-2">Exit</th>
                <th className="py-1 pr-2">Size</th>
                <th className="py-1 pr-2">PnL</th>
                <th className="py-1 pr-2">R</th>
                <th className="py-1 pr-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-gray-800">
                  <td className="py-1 pr-2">{t.symbol}</td>
                  <td className="py-1 pr-2">{t.direction}</td>
                  <td className="py-1 pr-2">{t.playbook}</td>
                  <td className="py-1 pr-2">
                    {new Date(t.entry_time).toLocaleString()}
                  </td>
                  <td className="py-1 pr-2">
                    {t.exit_time ? new Date(t.exit_time).toLocaleString() : '-'}
                  </td>
                  <td className="py-1 pr-2">{t.size}</td>
                  <td className="py-1 pr-2">{t.pnl ?? '-'}</td>
                  <td className="py-1 pr-2">{t.rr ?? '-'}</td>
                  <td className="py-1 pr-2">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
