import React, { useState } from 'react';
import { analyze } from '../lib/api';
import { useAgentStore } from '../store/useAgentStore';

export default function CandleUploader() {
  const [instrument, setInstrument] = useState('FOREX');
  const [timeframe, setTimeframe] = useState('15m');
  const [candlesText, setCandlesText] = useState(`[
  { "time": "2025-01-01T00:00:00Z", "open": 1.2000, "high": 1.2050, "low": 1.1990, "close": 1.2030 },
  { "time": "2025-01-01T00:15:00Z", "open": 1.2030, "high": 1.2080, "low": 1.2020, "close": 1.2060 },
  { "time": "2025-01-01T00:30:00Z", "open": 1.2060, "high": 1.2090, "low": 1.2040, "close": 1.2050 }
]`);
  const setResult = useAgentStore((s) => s.setResult);
  const setCandles = useAgentStore((s) => s.setCandles);

  async function sendRequest() {
    let candles;
    try {
      candles = JSON.parse(candlesText);
    } catch {
      alert('Invalid JSON');
      return;
    }

    const res = await analyze({
      instrument,
      timeframe,
      candles,
    });

    setCandles(candles, instrument, timeframe);
    setResult(res);
  }

  return (
    <div className="p-4 bg-[#11131a] rounded">
      <h2 className="text-xl font-semibold mb-4">Input Candles</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <select
          className="p-2 bg-black border border-gray-700 rounded"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
        >
          <option value="FOREX">FOREX</option>
          <option value="FUTURES">FUTURES</option>
          <option value="CRYPTO">CRYPTO</option>
          <option value="OTHER">OTHER</option>
        </select>
        <input
          className="p-2 bg-black border border-gray-700 rounded"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        />
      </div>
      <textarea
        rows={8}
        className="w-full p-2 bg-black border border-gray-700 rounded text-gray-200"
        placeholder="Paste candles JSON here..."
        value={candlesText}
        onChange={(e) => setCandlesText(e.target.value)}
      />
      <button
        onClick={sendRequest}
        className="mt-4 w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
      >
        Analyze
      </button>
    </div>
  );
}
