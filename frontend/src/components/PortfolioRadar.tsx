import React, { useState } from 'react';
import { getAuthHeader } from '../store/useAuthStore';

export default function PortfolioRadar() {
  const [data, setData] = useState<any>(null);
  const [rawPositions, setRawPositions] = useState<string>('');

  async function analyzePortfolio() {
    try {
      const positions = JSON.parse(rawPositions);
      const symbols = [...new Set(positions.map((p: any) => p.symbol))];

      // Fetch price history for each symbol
      const priceHistory: any = {};
      for (const s of symbols) {
        const r = await fetch(`/api/data/ohlc?provider=BINANCE&symbol=${s}&timeframe=1h&limit=200`);
        const j = await r.json();
        priceHistory[s] = j.candles.map((c: any) => c.close);
      }

      const res = await fetch(`/api/portfolio/radar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          positions,
          priceHistory,
          balance: 5000, // test balance
        }),
      });

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error analyzing portfolio:', err);
      alert(`Error: ${err.message}`);
    }
  }

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-4">
      <h2 className="text-xl font-semibold">Portfolio Risk Radar</h2>

      <textarea
        placeholder='[{"symbol":"BTCUSDT", "direction":"long","size":0.1,"entryPrice":40000,"currentPrice":42000,"instrument":"CRYPTO"}]'
        className="w-full h-24 bg-black text-gray-300 p-2 rounded text-xs"
        value={rawPositions}
        onChange={(e) => setRawPositions(e.target.value)}
      />

      <button
        onClick={analyzePortfolio}
        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500"
      >
        Analyze Risk
      </button>

      {data && (
        <div className="text-xs text-gray-300 mt-3 space-y-2">
          <h3 className="text-sm font-semibold">Exposure</h3>
          <pre className="bg-black p-2 rounded overflow-auto">
            {JSON.stringify(data.exposure, null, 2)}
          </pre>

          <h3 className="text-sm font-semibold">Correlation Matrix</h3>
          <pre className="bg-black p-2 rounded overflow-auto">
            {JSON.stringify(data.correlationMatrix, null, 2)}
          </pre>

          <h3 className="text-sm font-semibold">Basket Risk</h3>
          <pre className="bg-black p-2 rounded overflow-auto">
            {JSON.stringify(data.basket, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
