import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useAgentStore } from '../store/useAgentStore';
import { drawOverlays } from '../lib/lwOverlays';

export default function Chart() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const candles = useAgentStore((s) => s.candles);
  const result = useAgentStore((s) => s.result);
  const instrument = useAgentStore((s) => s.instrument);
  const timeframe = useAgentStore((s) => s.timeframe);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    // Create chart
    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#06070a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#111827' },
        horzLines: { color: '#111827' },
      },
      width: chartRef.current.clientWidth,
      height: 400,
    });

    chartInstanceRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00ff99',
      downColor: '#ff6464',
      borderUpColor: '#00ff99',
      borderDownColor: '#ff6464',
      wickUpColor: '#00ff99',
      wickDownColor: '#ff6464',
    });

    // Format candle data
    const formatted = candles.map((c: any, i: number) => {
      let time: number;
      if (typeof c.time === 'string') {
        time = Math.floor(new Date(c.time).getTime() / 1000);
      } else {
        time = Math.floor(c.time / 1000);
      }

      return {
        time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        index: i,
      };
    });

    candleSeries.setData(formatted);
    chart.timeScale().fitContent();

    // Draw overlays if available
    if (result?.tradePlan?.overlays) {
      drawOverlays(chart, candleSeries, formatted, result.tradePlan.overlays);
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles, result]);

  if (candles.length === 0) {
    return (
      <div className="p-4 bg-[#11131a] rounded h-full">
        <h2 className="text-xl font-semibold mb-4">Price Chart</h2>
        <p className="text-sm text-gray-400">No candles loaded yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#11131a] rounded h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Price Chart</h2>
        <span className="text-xs text-gray-400">
          {instrument} · {timeframe} · {candles.length} candles
        </span>
      </div>
      <div ref={chartRef} className="w-full h-[400px]" />
    </div>
  );
}
