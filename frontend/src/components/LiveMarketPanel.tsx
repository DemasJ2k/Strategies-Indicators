import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';

async function postJSON(path: string, body: any) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Request failed');
  }
  return res.json();
}

export default function LiveMarketPanel() {
  const [provider, setProvider] = useState('BINANCE');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [isActive, setIsActive] = useState(false);
  const setError = useAgentStore((s) => s.setError);
  const setLoading = useAgentStore((s) => s.setLoading);

  async function start() {
    try {
      setLoading(true);
      setError(null);
      await postJSON('/data/live/start', { provider, symbol, timeframe });
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start live stream');
    } finally {
      setLoading(false);
    }
  }

  async function stop() {
    try {
      setLoading(true);
      setError(null);
      await postJSON('/data/live/stop', { provider, symbol, timeframe });
      setIsActive(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop live stream');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Live Market Stream</h2>
        <span
          className={
            'text-xs px-2 py-1 rounded-full ' +
            (isActive ? 'bg-green-600/30 text-green-300' : 'bg-gray-700 text-gray-300')
          }
        >
          {isActive ? 'ACTIVE' : 'IDLE'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Provider</label>
          <select
            className="w-full bg-black border border-gray-700 rounded px-2 py-1"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="BINANCE">Binance (Crypto)</option>
            <option value="BYBIT">Bybit (Crypto)</option>
            <option value="OANDA">OANDA (Forex)</option>
            <option value="FXCM">FXCM (Forex)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Symbol</label>
          <input
            className="w-full bg-black border border-gray-700 rounded px-2 py-1"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Timeframe</label>
          <select
            className="w-full bg-black border border-gray-700 rounded px-2 py-1"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={isActive}
          className="px-3 py-1 bg-emerald-600 rounded hover:bg-emerald-500 disabled:opacity-50 text-sm"
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={!isActive}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 disabled:opacity-50 text-sm"
        >
          Stop
        </button>
      </div>

      <p className="text-[11px] text-gray-500">
        Streams raw candles from the chosen provider, runs the Flowrex agent on each update,
        and updates the chart + signal + overlays live.
      </p>
    </div>
  );
}
