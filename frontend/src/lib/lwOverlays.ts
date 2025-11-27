import { IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';

export function drawOverlays(
  chart: IChartApi,
  candleSeries: ISeriesApi<'Candlestick'>,
  candles: any[],
  overlays: any
) {
  // 1) Liquidity sweeps - horizontal price lines
  if (overlays.liquiditySweeps) {
    overlays.liquiditySweeps.forEach((sweep: any) => {
      candleSeries.createPriceLine({
        price: sweep.price,
        color: sweep.type === 'buy' ? 'rgba(255,0,0,0.6)' : 'rgba(0,200,255,0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: sweep.type === 'buy' ? 'Buy Liq' : 'Sell Liq',
      });
    });
  }

  // 2) MSS (market structure shift) - vertical markers
  if (overlays.mss) {
    overlays.mss.forEach((mss: any) => {
      if (mss.index >= 0 && mss.index < candles.length) {
        const candle = candles[mss.index];
        candleSeries.setMarkers([
          ...((candleSeries as any).markers?.() || []),
          {
            time: candle.time,
            position: mss.direction === 'bearish' ? 'aboveBar' : 'belowBar',
            color: mss.direction === 'bearish' ? '#ff4444' : '#44ff44',
            shape: 'arrowDown',
            text: 'MSS',
          },
        ]);
      }
    });
  }

  // 3) FVG zones - shaded areas (using line series as zones)
  if (overlays.fvg) {
    overlays.fvg.forEach((fvg: any) => {
      // Create upper and lower boundary lines for FVG
      candleSeries.createPriceLine({
        price: fvg.from,
        color: 'rgba(255, 165, 0, 0.4)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: 'FVG',
      });
      candleSeries.createPriceLine({
        price: fvg.to,
        color: 'rgba(255, 165, 0, 0.4)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: '',
      });
    });
  }

  // 4) Breaker block - horizontal zone
  if (overlays.breaker) {
    candleSeries.createPriceLine({
      price: overlays.breaker.from,
      color: 'rgba(0, 200, 255, 0.4)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Breaker',
    });
    candleSeries.createPriceLine({
      price: overlays.breaker.to,
      color: 'rgba(0, 200, 255, 0.4)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: false,
      title: '',
    });
  }

  // 5) Trendline - line connecting two points
  if (overlays.trendline) {
    const tl = overlays.trendline;
    if (tl.p1.index >= 0 && tl.p1.index < candles.length &&
        tl.p2.index >= 0 && tl.p2.index < candles.length) {
      const lineSeries = chart.addLineSeries({
        color: 'rgba(120,120,255,0.8)',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      lineSeries.setData([
        { time: candles[tl.p1.index].time, value: tl.p1.price },
        { time: candles[tl.p2.index].time, value: tl.p2.price },
      ]);
    }
  }

  // 6) Imbalance zones (Fabio) - similar to FVG
  if (overlays.imbalanceZones) {
    overlays.imbalanceZones.forEach((zone: any) => {
      candleSeries.createPriceLine({
        price: zone.from,
        color: 'rgba(255, 0, 200, 0.3)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: 'Imbalance',
      });
      candleSeries.createPriceLine({
        price: zone.to,
        color: 'rgba(255, 0, 200, 0.3)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: '',
      });
    });
  }

  // 7) PDH/PDL from context (if passed in overlays)
  if (overlays.pdh !== undefined) {
    candleSeries.createPriceLine({
      price: overlays.pdh,
      color: 'rgba(100, 200, 255, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'PDH',
    });
  }

  if (overlays.pdl !== undefined) {
    candleSeries.createPriceLine({
      price: overlays.pdl,
      color: 'rgba(100, 200, 255, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'PDL',
    });
  }

  // 8) OTE zone for NBB playbook (if passed in overlays)
  if (overlays.oteFrom !== undefined && overlays.oteTo !== undefined) {
    candleSeries.createPriceLine({
      price: Math.min(overlays.oteFrom, overlays.oteTo),
      color: 'rgba(255, 200, 0, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OTE Lower',
    });
    candleSeries.createPriceLine({
      price: Math.max(overlays.oteFrom, overlays.oteTo),
      color: 'rgba(255, 200, 0, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OTE Upper',
    });
  }
}
