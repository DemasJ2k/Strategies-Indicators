import React, { useState } from 'react';
import { analyze } from '../lib/api';
import { useAgentStore } from '../store/useAgentStore';

export default function CandleUploader() {
  const [instrument, setInstrument] = useState('FOREX');
  const [timeframe, setTimeframe] = useState('15m');
  const [candlesText, setCandlesText] = useState('');
  const setResult = useAgentStore((s) => s.setResult);

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
