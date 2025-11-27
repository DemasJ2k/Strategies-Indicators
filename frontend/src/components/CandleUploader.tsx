import React, { useState } from 'react';
import { analyze } from '../lib/api';
import { useAgentStore } from '../store/useAgentStore';

export default function CandleUploader() {
  const [instrument, setInstrument] = useState('FOREX');
  const [timeframe, setTimeframe] = useState('15m');
  const [symbol, setSymbol] = useState('EURUSD');
  const [pdh, setPdh] = useState('');
  const [pdl, setPdl] = useState('');
  const [candlesText, setCandlesText] = useState(`[
  { "time": "2025-01-01T00:00:00Z", "open": 1.2000, "high": 1.2050, "low": 1.1990, "close": 1.2030 },
  { "time": "2025-01-01T00:15:00Z", "open": 1.2030, "high": 1.2080, "low": 1.2020, "close": 1.2060 },
  { "time": "2025-01-01T00:30:00Z", "open": 1.2060, "high": 1.2090, "low": 1.2040, "close": 1.2050 }
]`);
  const setResult = useAgentStore((s) => s.setResult);
  const setExecutionCandles = useAgentStore((s) => s.setExecutionCandles);
  const htfCandles = useAgentStore((s) => s.htfCandles);
  const candles4H = useAgentStore((s) => s.candles4H);

  async function sendRequest() {
    let candles;
    try {
      candles = JSON.parse(candlesText);
    } catch {
      alert('Invalid JSON');
      return;
    }

    const payload: any = {
      instrument,
      timeframe,
      symbol,
      candles,
    };

    if (pdh) payload.pdh = Number(pdh);
    if (pdl) payload.pdl = Number(pdl);

    // Attach multi-TF if available
    if (htfCandles && htfCandles.length > 0) {
      payload.htfCandles = htfCandles;
    }
    if (candles4H && candles4H.length > 0) {
      payload.candles4H = candles4H;
    }

    const res = await analyze(payload);

    setExecutionCandles(candles, instrument, timeframe);
    setResult(res);
  }

  return (
    <div className="p-4 bg-[#11131a] rounded">
      <h2 className="text-xl font-semibold mb-4">Input Candles</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-400">Instrument</label>
          <select
            className="w-full p-2 bg-black border border-gray-700 rounded"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            <option value="FOREX">FOREX</option>
            <option value="FUTURES">FUTURES</option>
            <option value="CRYPTO">CRYPTO</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Timeframe</label>
          <input
            className="w-full p-2 bg-black border border-gray-700 rounded"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Symbol</label>
          <input
            className="w-full p-2 bg-black border border-gray-700 rounded"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400">PDH</label>
            <input
              className="w-full p-2 bg-black border border-gray-700 rounded"
              placeholder="e.g. 1.2100"
              value={pdh}
              onChange={(e) => setPdh(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">PDL</label>
            <input
              className="w-full p-2 bg-black border border-gray-700 rounded"
              placeholder="e.g. 1.1950"
              value={pdl}
              onChange={(e) => setPdl(e.target.value)}
            />
          </div>
        </div>
      </div>
      <label className="text-xs text-gray-400 mb-1 block">
        OHLC Candles JSON (array)
      </label>
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
