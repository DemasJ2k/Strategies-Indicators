import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useAgentStore } from '../store/useAgentStore';
import { drawOverlays } from '../lib/lwOverlays';

export default function Chart() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const { candles, htfCandles, result, instrument, timeframe } = useAgentStore();
  const [view, setView] = useState<'EXEC' | 'HTF'>('EXEC');

  const activeCandles = view === 'EXEC' ? candles : htfCandles;
  const activeLabel =
    view === 'EXEC' ? `${instrument} · ${timeframe}` : `${instrument} · HTF`;

  useEffect(() => {
    if (!chartRef.current || activeCandles.length === 0) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#06070a' },
        textColor: '#ccc',
      },
      grid: {
        vertLines: { color: '#111' },
        horzLines: { color: '#111' },
      },
      width: chartRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: '#222',
      },
      rightPriceScale: {
        borderColor: '#222',
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      wickUpColor: '#00ff99',
      wickDownColor: '#ff6464',
      borderUpColor: '#00ff99',
      borderDownColor: '#ff6464',
      upColor: '#00ff9955',
      downColor: '#ff646455',
    });

    const formatted = activeCandles.map((c: any, i: number) => ({
      time:
        typeof c.time === 'string'
          ? new Date(c.time).getTime() / 1000
          : Math.floor(c.time / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      index: i,
    }));

    candleSeries.setData(formatted);

    if (result?.tradePlan?.overlays && view === 'EXEC') {
      drawOverlays(chart, candleSeries, formatted, result.tradePlan.overlays);
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartRef.current?.clientWidth });
      chart.timeScale().fitContent();
    };

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [activeCandles, result, view]);

  return (
    <div className="p-4 bg-[#11131a] rounded h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Price Chart</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>
            {activeLabel} · {activeCandles.length} candles
          </span>
          <select
            className="bg-black border border-gray-700 rounded px-2 py-1"
            value={view}
            onChange={(e) => setView(e.target.value as any)}
          >
            <option value="EXEC">Execution</option>
            <option value="HTF">HTF</option>
          </select>
        </div>
      </div>

      <div ref={chartRef} className="w-full h-[400px]"></div>
    </div>
  );
}
