import { PortfolioPosition, BasketRisk, CorrelationMatrix, PositionExposure } from './types';

export function computeBasketRisk(
  positions: PortfolioPosition[],
  corr: CorrelationMatrix,
  exposures: PositionExposure[],
  accountBalance: number
): BasketRisk {
  let alerts: string[] = [];

  // Summaries
  let usdExposure = 0;
  let jpyExposure = 0;

  positions.forEach((p) => {
    if (p.symbol.endsWith('USD')) {
      usdExposure += p.direction === 'long' ? p.size : -p.size;
    }
    if (p.symbol.endsWith('JPY')) {
      jpyExposure += p.direction === 'long' ? p.size : -p.size;
    }
  });

  // Diversification (based on correlation)
  const n = corr.symbols.length;
  let avgCorr = 0;
  if (n > 1) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += Math.abs(corr.matrix[i][j]);
        count++;
      }
    }
    avgCorr = sum / count;
  }

  const diversificationScore = Math.round(100 - avgCorr * 100);

  // Portfolio volatility (simple proxy)
  const totalRisk = exposures.reduce((s, e) => s + e.riskValue, 0);
  const volatility = totalRisk / accountBalance;

  // Overall basket score
  let score = Math.min(100, volatility * 100);

  // Alerts
  if (Math.abs(usdExposure) > 2) alerts.push('High USD directional exposure.');
  if (Math.abs(jpyExposure) > 2) alerts.push('JPY cluster exposure detected.');
  if (avgCorr > 0.75) alerts.push('Portfolio highly correlated.');
  if (volatility > 0.05) alerts.push('High portfolio volatility.');

  return {
    score,
    volatility,
    usdExposure,
    jpyExposure,
    diversificationScore,
    alerts,
  };
}
