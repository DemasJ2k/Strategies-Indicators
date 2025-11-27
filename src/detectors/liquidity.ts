import { LiquidityDetectorOutput } from '@types/detector';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * LIQUIDITY ZONES DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Identifies liquidity pools and sweeps.
 *
 * Logic:
 *   - Detects swing highs and lows (liquidity zones)
 *   - Identifies when liquidity is swept
 *   - Tracks swept levels and direction
 */

interface PriceData {
  high: number;
  low: number;
  close: number;
  time?: number;
}

/**
 * Detect Liquidity Zones and Sweeps
 * @param data - Array of price data
 * @param previousHigh - Previous session/day high
 * @param previousLow - Previous session/day low
 * @returns LiquidityDetectorOutput with zones and swept levels
 */
export function detectLiquidity(
  data: PriceData[],
  previousHigh?: number,
  previousLow?: number
): LiquidityDetectorOutput {
  logger.info('  💧 Detecting Liquidity Zones...');

  if (!data || data.length < 3) {
    logger.warn('  ⚠ Insufficient data for liquidity detection');
    return { zones: { high: [], low: [] }, swept: [] };
  }

  // Detect swing highs and lows (liquidity zones)
  const highZones = detectSwingHighs(data);
  const lowZones = detectSwingLows(data);

  // Detect swept levels
  const sweptLevels = detectSweptLiquidity(data, highZones, lowZones, previousHigh, previousLow);

  if (sweptLevels.length > 0) {
    logger.success(
      `  ✓ Liquidity Sweep Detected: ${sweptLevels.map((s) => s.direction).join(', ')}`
    );
  } else {
    logger.info('  → No liquidity sweeps detected');
  }

  logger.info(`  → ${highZones.length} high zones, ${lowZones.length} low zones identified`);

  return {
    zones: {
      high: highZones,
      low: lowZones,
    },
    swept: sweptLevels,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Detect swing highs (potential liquidity zones above price)
 */
function detectSwingHighs(data: PriceData[]): number[] {
  const swingHighs: number[] = [];

  // Look for local highs (candle higher than neighbors)
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i].high > data[i - 1].high && data[i].high > data[i + 1].high) {
      swingHighs.push(data[i].high);
    }
  }

  return swingHighs;
}

/**
 * Detect swing lows (potential liquidity zones below price)
 */
function detectSwingLows(data: PriceData[]): number[] {
  const swingLows: number[] = [];

  // Look for local lows (candle lower than neighbors)
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i].low < data[i - 1].low && data[i].low < data[i + 1].low) {
      swingLows.push(data[i].low);
    }
  }

  return swingLows;
}

/**
 * Detect swept liquidity levels
 * A sweep occurs when price briefly moves beyond a level then reverses
 */
function detectSweptLiquidity(
  data: PriceData[],
  highZones: number[],
  lowZones: number[],
  previousHigh?: number,
  previousLow?: number
): Array<{ level: number; direction: 'high' | 'low' }> {
  const swept: Array<{ level: number; direction: 'high' | 'low' }> = [];

  const recentData = data.slice(-5); // Check recent candles
  const currentPrice = recentData[recentData.length - 1].close;

  // Check for high sweeps (price went above then came back down)
  for (const highZone of highZones) {
    const wentAbove = recentData.some((candle) => candle.high > highZone);
    const cameback = currentPrice < highZone;

    if (wentAbove && cameback) {
      swept.push({ level: highZone, direction: 'high' });
    }
  }

  // Check for low sweeps (price went below then came back up)
  for (const lowZone of lowZones) {
    const wentBelow = recentData.some((candle) => candle.low < lowZone);
    const cameBack = currentPrice > lowZone;

    if (wentBelow && cameBack) {
      swept.push({ level: lowZone, direction: 'low' });
    }
  }

  // Check previous day high/low sweeps
  if (previousHigh) {
    const sweptPDH = recentData.some((c) => c.high > previousHigh) && currentPrice < previousHigh;
    if (sweptPDH) {
      swept.push({ level: previousHigh, direction: 'high' });
    }
  }

  if (previousLow) {
    const sweptPDL = recentData.some((c) => c.low < previousLow) && currentPrice > previousLow;
    if (sweptPDL) {
      swept.push({ level: previousLow, direction: 'low' });
    }
  }

  return swept;
}
