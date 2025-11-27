import React, { useCallback } from 'react';
import Papa from 'papaparse';
import { useAgentStore } from '../store/useAgentStore';

export default function CsvUploader() {
  const setCandles = useAgentStore((s) => s.setCandles);
  const instrument = useAgentStore((s) => s.instrument);
  const timeframe = useAgentStore((s) => s.timeframe);

  const handleFile = useCallback(
    (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const rows = results.data;

          const candles = rows.map((r: any) => ({
            time: r.time || r.datetime || r.date,
            open: Number(r.open),
            high: Number(r.high),
            low: Number(r.low),
            close: Number(r.close),
            volume: r.volume ? Number(r.volume) : undefined,
          }));

          setCandles(candles, instrument, timeframe);
          alert(`Loaded ${candles.length} candles`);
        },
      });
    },
    [instrument, timeframe, setCandles]
  );

  return (
    <div className="p-4 bg-[#11131a] rounded">
      <h2 className="text-xl font-semibold mb-4">Import CSV</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="block w-full text-sm text-gray-300"
      />
      <p className="text-xs text-gray-500 mt-2">
        Required columns: <b>time, open, high, low, close</b>
      </p>
    </div>
  );
}
