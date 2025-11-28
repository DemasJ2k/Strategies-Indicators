import { PortfolioPosition, PositionExposure } from './types';

export function computeExposure(
  positions: PortfolioPosition[],
  accountBalance: number
): PositionExposure[] {
  return positions.map((p) => {
    const pipValue =
      p.instrument === 'FOREX'
        ? 0.0001 * p.size * 100000
        : p.instrument === 'CRYPTO'
        ? p.size
        : p.size;

    const stopDistance = Math.abs(p.currentPrice - p.entryPrice);
    const riskValue = pipValue * stopDistance;
    const normalizedRisk = Math.min(100, (riskValue / accountBalance) * 100);

    return {
      symbol: p.symbol,
      netExposure: p.direction === 'long' ? p.size : -p.size,
      riskValue,
      normalizedRisk,
    };
  });
}
