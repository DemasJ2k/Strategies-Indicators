import React, { useEffect, useRef, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { analyze } from '../lib/api';

export default function ReplayController() {
  const candles = useAgentStore((s) => s.candles);
  const instrument = useAgentStore((s) => s.instrument);
  const timeframe = useAgentStore((s) => s.timeframe);
  const setResult = useAgentStore((s) => s.setResult);
  const settings = useAgentStore((s) => s.settings);

  const [index, setIndex] = useState(50);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<any>(null);

  async function runStep(i: number) {
    if (!candles || candles.length < 3) return;
    if (i < 2 || i >= candles.length) return;

    const slice = candles.slice(0, i);
    const res = await analyze({
      instrument,
      timeframe,
      candles: slice,
      overrideConfig: settings,
    });

    setIndex(i);
    setResult(res);
  }

  function stepForward() {
    const next = index + 1;
    runStep(next);
  }

  function stepBack() {
    const prev = index - 1;
    runStep(prev);
  }

  // Autoplay
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        stepForward();
      }, 500);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [playing, index]);

  if (candles.length < 10)
    return (
      <div className="p-4 bg-[#11131a] rounded">
        <h2 className="text-xl font-semibold">Replay</h2>
        <p className="text-sm text-gray-500">Import CSV to enable replay.</p>
      </div>
    );

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-3">
      <h2 className="text-xl font-semibold">Replay</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={stepBack}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          ◀
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={stepForward}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          ▶
        </button>
      </div>
      <input
        type="range"
        className="w-full"
        min={2}
        max={candles.length - 1}
        value={index}
        onChange={(e) => runStep(Number(e.target.value))}
      />
      <div className="text-xs text-gray-400">
        Candle {index} / {candles.length - 1}
      </div>
    </div>
  );
}
