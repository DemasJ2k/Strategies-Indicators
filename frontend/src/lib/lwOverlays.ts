// Helper: crude session classification by UTC hour
function getSessionFromTime(timeSec: number): 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OTHER' {
  const d = new Date(timeSec * 1000);
  const h = d.getUTCHours();

  if (h >= 0 && h < 8) return 'ASIAN';
  if (h >= 8 && h < 12) return 'LONDON';
  if (h >= 12 && h < 17) return 'NEW_YORK';
  return 'OTHER';
}

function buildSessionMarkers(candles: any[]) {
  const markers: any[] = [];
  let lastSession: string | null = null;

  candles.forEach((c, i) => {
    const session = getSessionFromTime(c.time);
    if (session === 'OTHER') return;

    if (session !== lastSession) {
      markers.push({
        time: c.time,
        position: 'belowBar',
        color:
          session === 'ASIAN'
            ? '#22c55e'
            : session === 'LONDON'
            ? '#facc15'
            : '#38bdf8',
        shape: 'arrowUp',
        text: session === 'ASIAN' ? 'A' : session === 'LONDON' ? 'L' : 'NY',
      });
      lastSession = session;
    }
  });

  return markers;
}

export function drawOverlays(chart: any, candleSeries: any, candles: any[], overlays: any) {
  // ---- TRENDLINE ----
  if (overlays.trendline) {
    const { p1, p2 } = overlays.trendline;

    chart
      .addLineSeries({
        color: 'rgba(100,120,255,0.9)',
        lineWidth: 2,
      })
      .setData([
        { time: candles[p1.index].time, value: p1.price },
        { time: candles[p2.index].time, value: p2.price },
      ]);
  }

  // ---- BREAKER BLOCK ----
  if (overlays.breaker) {
    const { from, to } = overlays.breaker;

    const boxSeries = chart.addHistogramSeries({
      color: 'rgba(0, 200, 255, 0.15)',
      priceFormat: { type: 'price' },
    });

    const boxData = candles.map((c) => ({
      time: c.time,
      value: to,
    }));

    boxSeries.setData(boxData);
  }

  // ---- FVG ZONES ----
  if (overlays.fvg) {
    overlays.fvg.forEach((fvg: any) => {
      const box = chart.addHistogramSeries({
        color: 'rgba(255, 165, 0, 0.15)',
      });

      box.setData(
        candles.map((c, i) =>
          i === fvg.index ? { time: c.time, value: fvg.to } : { time: c.time, value: null }
        )
      );
    });
  }

  // ---- IMBALANCE ZONES ----
  if (overlays.imbalanceZones) {
    overlays.imbalanceZones.forEach((z: any) => {
      const box = chart.addHistogramSeries({
        color: 'rgba(255, 0, 200, 0.15)',
      });

      box.setData(
        candles.map((c, i) =>
          i === z.index ? { time: c.time, value: z.to } : { time: c.time, value: null }
        )
      );
    });
  }

  // ---- LIQUIDITY SWEEPS ----
  if (overlays.liquiditySweeps) {
    const sweepSeries = chart.addLineSeries({
      color: 'rgba(255, 0, 0, 0.9)',
      lineWidth: 1,
      lineStyle: 2,
    });

    overlays.liquiditySweeps.forEach((sweep: any) => {
      const c = candles[sweep.index];
      if (!c) return;

      sweepSeries.update({
        time: c.time,
        value: sweep.price,
      });
    });
  }

  // ---- MSS EVENTS ----
  if (overlays.mss) {
    overlays.mss.forEach((mss: any) => {
      const c = candles[mss.index];
      if (!c) return;

      const color = mss.direction === 'bearish' ? '#ff4444' : '#44ff44';

      chart
        .addLineSeries({
          color,
          lineWidth: 2,
        })
        .setData([
          { time: c.time, value: c.high },
          { time: c.time, value: c.low },
        ]);
    });
  }

  // ---- SESSION MARKERS ----
  const sessionMarkers = buildSessionMarkers(candles);
  candleSeries.setMarkers(sessionMarkers);
}
