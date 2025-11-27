export function generateAnnotations(plan: any, candles: any[]) {
  if (!plan || !plan.overlays) return {};

  const ann: any = {};

  // 1) Liquidity sweeps
  if (plan.overlays.liquiditySweeps) {
    plan.overlays.liquiditySweeps.forEach((sweep: any, i: number) => {
      ann[`liq_${i}`] = {
        type: 'line',
        borderColor:
          sweep.type === 'buy'
            ? 'rgba(255,0,0,0.6)'
            : 'rgba(0,200,255,0.6)',
        borderWidth: 1,
        borderDash: [4, 4],
        scaleID: 'y',
        value: sweep.price,
      };
    });
  }

  // 2) MSS (market structure shift)
  if (plan.overlays.mss) {
    plan.overlays.mss.forEach((mss: any, i: number) => {
      ann[`mss_${i}`] = {
        type: 'line',
        borderColor: mss.direction === 'bearish' ? '#ff4444' : '#44ff44',
        borderWidth: 1.5,
        scaleID: 'x',
        value: mss.index,
      };
    });
  }

  // 3) FVG zones
  if (plan.overlays.fvg) {
    plan.overlays.fvg.forEach((fvg: any, i: number) => {
      ann[`fvg_${i}`] = {
        type: 'box',
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        yMin: fvg.from,
        yMax: fvg.to,
        xMin: fvg.index - 1,
        xMax: fvg.index + 1,
      };
    });
  }

  // 4) Breaker block
  if (plan.overlays.breaker) {
    ann['breaker'] = {
      type: 'box',
      backgroundColor: 'rgba(0, 200, 255, 0.15)',
      yMin: plan.overlays.breaker.from,
      yMax: plan.overlays.breaker.to,
      xMin: 0,
      xMax: candles.length - 1,
    };
  }

  // 5) Trendline
  if (plan.overlays.trendline) {
    const tl = plan.overlays.trendline;
    ann['trendline'] = {
      type: 'line',
      borderColor: 'rgba(120,120,255,0.8)',
      borderWidth: 2,
      xMin: tl.p1.index,
      yMin: tl.p1.price,
      xMax: tl.p2.index,
      yMax: tl.p2.price,
    };
  }

  // 6) Imbalance zones (Fabio)
  if (plan.overlays.imbalanceZones) {
    plan.overlays.imbalanceZones.forEach((zone: any, i: number) => {
      ann[`imbalance_${i}`] = {
        type: 'box',
        backgroundColor: 'rgba(255, 0, 200, 0.1)',
        yMin: zone.from,
        yMax: zone.to,
        xMin: zone.index - 1,
        xMax: zone.index + 1,
      };
    });
  }

  return ann;
}
