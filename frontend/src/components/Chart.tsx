import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useAgentStore } from '../store/useAgentStore';
import { generateAnnotations } from '../lib/chartOverlays';
import 'chart.js/auto';

export default function Chart() {
  const candles = useAgentStore((s) => s.candles);
  const result = useAgentStore((s) => s.result);
  const instrument = useAgentStore((s) => s.instrument);
  const timeframe = useAgentStore((s) => s.timeframe);

  const context = result?.context;
  const plan = result?.tradePlan;

  const pdh = context?.pdh;
  const pdl = context?.pdl;

  const isNBB = plan?.playbook === 'NBB';
  const oteFrom = plan?.entry?.zone?.from;
  const oteTo = plan?.entry?.zone?.to;

  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) {
      return null;
    }

    const labels = candles.map((c) =>
      typeof c.time === 'string' ? c.time : new Date(c.time).toISOString()
    );
    const closes = candles.map((c) => c.close);

    const datasets: any[] = [
      {
        label: 'Close',
        data: closes,
        borderWidth: 1.5,
        tension: 0.1,
      },
    ];

    if (pdh !== undefined) {
      datasets.push({
        label: 'PDH',
        data: closes.map(() => pdh),
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      });
    }

    if (pdl !== undefined) {
      datasets.push({
        label: 'PDL',
        data: closes.map(() => pdl),
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      });
    }

    if (isNBB && oteFrom !== undefined && oteTo !== undefined) {
      datasets.push(
        {
          label: 'OTE Lower',
          data: closes.map(() => Math.min(oteFrom, oteTo)),
          borderWidth: 1,
          borderDash: [6, 3],
          pointRadius: 0,
        },
        {
          label: 'OTE Upper',
          data: closes.map(() => Math.max(oteFrom, oteTo)),
          borderWidth: 1,
          borderDash: [6, 3],
          pointRadius: 0,
        }
      );
    }

    return {
      labels,
      datasets,
    };
  }, [candles, pdh, pdl, isNBB, oteFrom, oteTo]);

  if (!chartData) {
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
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            annotation: {
              annotations: generateAnnotations(plan, candles),
            },
            legend: {
              labels: {
                color: '#e5e7eb',
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#9ca3af', maxRotation: 0, autoSkip: true },
              grid: { color: '#111827' },
            },
            y: {
              ticks: { color: '#9ca3af' },
              grid: { color: '#111827' },
            },
          },
        }}
      />
    </div>
  );
}
