import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { useAgentStore } from '../store/useAgentStore';

export default function CsvUploader() {
  const [role, setRole] = useState<'EXEC' | 'HTF' | 'H4'>('EXEC');

  const setExecutionCandles = useAgentStore((s) => s.setExecutionCandles);
  const setHTFCandles = useAgentStore((s) => s.setHTFCandles);
  const setCandles4H = useAgentStore((s) => s.setCandles4H);

  const instrument = useAgentStore((s) => s.instrument);
  const timeframe = useAgentStore((s) => s.timeframe);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
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
            volume: r.volume != null ? Number(r.volume) : undefined,
          }));

          if (role === 'EXEC') {
            setExecutionCandles(candles, instrument, timeframe);
          } else if (role === 'HTF') {
            setHTFCandles(candles);
          } else if (role === 'H4') {
            setCandles4H(candles);
          }

          alert(`Loaded ${candles.length} candles as ${role}`);
        },
      });
    },
    [role, instrument, timeframe, setExecutionCandles, setHTFCandles, setCandles4H]
  );

  return (
    <div className="p-4 bg-[#11131a] rounded">
      <h2 className="text-xl font-semibold mb-4">Import CSV</h2>

      <div className="mb-2">
        <label className="text-xs text-gray-400">Role</label>
        <select
          className="w-full p-2 bg-black border border-gray-700 rounded mt-1"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="EXEC">Execution TF (main)</option>
          <option value="HTF">Higher TF (e.g. 4H/Daily)</option>
          <option value="H4">Dedicated 4H for Tori</option>
        </select>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="block w-full text-sm text-gray-300"
      />

      <p className="text-xs text-gray-500 mt-2">
        Required columns: <b>time, open, high, low, close</b> (volume optional).
      </p>
    </div>
  );
}
