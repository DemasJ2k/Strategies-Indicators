import { LiquidityDetectorOutput } from '@types/detector';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * ADVANCED LIQUIDITY DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Comprehensive liquidity analysis including:
 *   - Swing highs/lows (liquidity zones)
 *   - Liquidity sweeps
 *   - FVG (Fair Value Gaps)
 *   - MSS (Market Structure Shift)
 *   - Imbalances
 *   - Session-based sweeps
 */

interface PriceData {
  high: number;
  low: number;
  close: number;
  open?: number;
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
  logger.info('  💧 Detecting Liquidity Zones & Advanced Patterns...');

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
// CORE LIQUIDITY FUNCTIONS
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

// ═══════════════════════════════════════════════════════════════
// ADVANCED PATTERNS - FVG, MSS, IMBALANCE
// ═══════════════════════════════════════════════════════════════

export interface FVGOutput {
  exists: boolean;
  type: 'bullish' | 'bearish' | null;
  high: number | null;
  low: number | null;
  unfilled: boolean;
}

/**
 * Detect Fair Value Gap (FVG)
 * FVG = Gap between candles (3-candle pattern)
 * Bullish FVG: Candle 1 high < Candle 3 low
 * Bearish FVG: Candle 1 low > Candle 3 high
 */
export function detectFVG(candles: PriceData[]): FVGOutput {
  logger.info('  📐 Detecting Fair Value Gaps (FVG)...');

  if (candles.length < 3) {
    logger.warn('      ✗ Insufficient candles for FVG detection');
    return { exists: false, type: null, high: null, low: null, unfilled: false };
  }

  // Check last 3 candles for FVG
  const c1 = candles[candles.length - 3];
  const c2 = candles[candles.length - 2];
  const c3 = candles[candles.length - 1];

  // Bullish FVG: Gap up (c1.high < c3.low)
  if (c1.high < c3.low) {
    const gapHigh = c3.low;
    const gapLow = c1.high;
    const unfilled = c3.close > gapLow; // Gap still unfilled

    logger.success(`      ✓ BULLISH FVG: ${gapLow} - ${gapHigh} (${unfilled ? 'UNFILLED' : 'FILLED'})`);
    return {
      exists: true,
      type: 'bullish',
      high: gapHigh,
      low: gapLow,
      unfilled,
    };
  }

  // Bearish FVG: Gap down (c1.low > c3.high)
  if (c1.low > c3.high) {
    const gapHigh = c1.low;
    const gapLow = c3.high;
    const unfilled = c3.close < gapHigh; // Gap still unfilled

    logger.success(`      ✓ BEARISH FVG: ${gapLow} - ${gapHigh} (${unfilled ? 'UNFILLED' : 'FILLED'})`);
    return {
      exists: true,
      type: 'bearish',
      high: gapHigh,
      low: gapLow,
      unfilled,
    };
  }

  logger.info('      → No FVG detected');
  return { exists: false, type: null, high: null, low: null, unfilled: false };
}

export interface MSSOutput {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  level: number | null;
}

/**
 * Detect Market Structure Shift (MSS)
 * Bullish MSS: Close above previous swing high
 * Bearish MSS: Close below previous swing low
 */
export function detectMSS(candles: PriceData[]): MSSOutput {
  logger.info('  🔄 Detecting Market Structure Shift (MSS)...');

  if (candles.length < 5) {
    logger.warn('      ✗ Insufficient candles for MSS detection');
    return { detected: false, type: null, level: null };
  }

  const recentCandles = candles.slice(-10);
  const currentCandle = recentCandles[recentCandles.length - 1];

  // Find previous swing high
  const swingHighs = recentCandles
    .slice(0, -1)
    .map((c, i) => ({ high: c.high, index: i }))
    .filter((_, i, arr) => {
      if (i === 0 || i === arr.length - 1) return false;
      return arr[i].high > arr[i - 1].high && arr[i].high > arr[i + 1].high;
    });

  // Find previous swing low
  const swingLows = recentCandles
    .slice(0, -1)
    .map((c, i) => ({ low: c.low, index: i }))
    .filter((_, i, arr) => {
      if (i === 0 || i === arr.length - 1) return false;
      return arr[i].low < arr[i - 1].low && arr[i].low < arr[i + 1].low;
    });

  // Bullish MSS: Current close > previous swing high
  if (swingHighs.length > 0) {
    const prevHigh = Math.max(...swingHighs.map((s) => s.high));
    if (currentCandle.close > prevHigh) {
      logger.success(`      ✓ BULLISH MSS: Closed above ${prevHigh}`);
      return { detected: true, type: 'bullish', level: prevHigh };
    }
  }

  // Bearish MSS: Current close < previous swing low
  if (swingLows.length > 0) {
    const prevLow = Math.min(...swingLows.map((s) => s.low));
    if (currentCandle.close < prevLow) {
      logger.success(`      ✓ BEARISH MSS: Closed below ${prevLow}`);
      return { detected: true, type: 'bearish', level: prevLow };
    }
  }

  logger.info('      → No MSS detected');
  return { detected: false, type: null, level: null };
}

export interface ImbalanceOutput {
  detected: boolean;
  type: 'gap_up' | 'gap_down' | 'none';
  size: number;
}

/**
 * Detect Imbalance (for Fabio playbook)
 * Imbalance = Price gap/jump between candles
 */
export function detectImbalance(candles: PriceData[]): ImbalanceOutput {
  logger.info('  ⚖️ Detecting Imbalances...');

  if (candles.length < 2) {
    logger.warn('      ✗ Insufficient candles for imbalance detection');
    return { detected: false, type: 'none', size: 0 };
  }

  const prev = candles[candles.length - 2];
  const current = candles[candles.length - 1];

  // Gap up: current.low > prev.high
  if (current.low > prev.high) {
    const gapSize = current.low - prev.high;
    logger.success(`      ✓ GAP UP Imbalance: ${gapSize.toFixed(2)} points`);
    return { detected: true, type: 'gap_up', size: gapSize };
  }

  // Gap down: current.high < prev.low
  if (current.high < prev.low) {
    const gapSize = prev.low - current.high;
    logger.success(`      ✓ GAP DOWN Imbalance: ${gapSize.toFixed(2)} points`);
    return { detected: true, type: 'gap_down', size: gapSize };
  }

  logger.info('      → No imbalance detected');
  return { detected: false, type: 'none', size: 0 };
}

export interface SessionSweepOutput {
  detected: boolean;
  sweptLevel: number | null;
  direction: 'high' | 'low' | null;
  session: 'asian' | 'london' | null;
}

/**
 * Detect Session Sweep (for JadeCap playbook)
 * Identifies when Asian/London highs/lows are swept during NY session
 */
export function detectSessionSweep(
  candles: PriceData[],
  asianHigh?: number,
  asianLow?: number,
  londonHigh?: number,
  londonLow?: number
): SessionSweepOutput {
  logger.info('  🌏 Detecting Session Sweeps...');

  if (candles.length < 2) {
    logger.warn('      ✗ Insufficient data for session sweep detection');
    return { detected: false, sweptLevel: null, direction: null, session: null };
  }

  const recentCandles = candles.slice(-5);
  const currentPrice = recentCandles[recentCandles.length - 1].close;

  // Check Asian high sweep
  if (asianHigh) {
    const sweptAsianHigh =
      recentCandles.some((c) => c.high > asianHigh) && currentPrice < asianHigh;
    if (sweptAsianHigh) {
      logger.success(`      ✓ ASIAN HIGH swept at ${asianHigh}`);
      return {
        detected: true,
        sweptLevel: asianHigh,
        direction: 'high',
        session: 'asian',
      };
    }
  }

  // Check Asian low sweep
  if (asianLow) {
    const sweptAsianLow = recentCandles.some((c) => c.low < asianLow) && currentPrice > asianLow;
    if (sweptAsianLow) {
      logger.success(`      ✓ ASIAN LOW swept at ${asianLow}`);
      return {
        detected: true,
        sweptLevel: asianLow,
        direction: 'low',
        session: 'asian',
      };
    }
  }

  // Check London high sweep
  if (londonHigh) {
    const sweptLondonHigh =
      recentCandles.some((c) => c.high > londonHigh) && currentPrice < londonHigh;
    if (sweptLondonHigh) {
      logger.success(`      ✓ LONDON HIGH swept at ${londonHigh}`);
      return {
        detected: true,
        sweptLevel: londonHigh,
        direction: 'high',
        session: 'london',
      };
    }
  }

  // Check London low sweep
  if (londonLow) {
    const sweptLondonLow = recentCandles.some((c) => c.low < londonLow) && currentPrice > londonLow;
    if (sweptLondonLow) {
      logger.success(`      ✓ LONDON LOW swept at ${londonLow}`);
      return {
        detected: true,
        sweptLevel: londonLow,
        direction: 'low',
        session: 'london',
      };
    }
  }

  logger.info('      → No session sweep detected');
  return { detected: false, sweptLevel: null, direction: null, session: null };
}
