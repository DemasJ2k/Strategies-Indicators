import { PortfolioPosition, CorrelationMatrix } from './types';

export function computeCorrelationMatrix(
  positions: PortfolioPosition[],
  priceHistory: Record<string, number[]>
): CorrelationMatrix {
  const symbols = positions.map((p) => p.symbol);
  const matrix: number[][] = [];

  function corr(a: number[], b: number[]): number {
    const n = a.length;
    if (n === 0 || b.length !== n) return 0;

    const meanA = a.reduce((s, v) => s + v, 0) / n;
    const meanB = b.reduce((s, v) => s + v, 0) / n;

    let num = 0,
      denA = 0,
      denB = 0;

    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }

    if (!denA || !denB) return 0;
    return num / Math.sqrt(denA * denB);
  }

  for (let i = 0; i < symbols.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      const s1 = symbols[i];
      const s2 = symbols[j];
      matrix[i][j] = corr(priceHistory[s1] || [], priceHistory[s2] || []);
    }
  }

  return { symbols, matrix };
}
