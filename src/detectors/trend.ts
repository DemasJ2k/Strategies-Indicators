import { TrendDetectorOutput } from '@types/detector';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * HTF TREND DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Analyzes higher timeframe trend direction and strength.
 *
 * Logic:
 *   - Analyzes price action over multiple candles
 *   - Determines bullish, bearish, or neutral trend
 *   - Calculates trend strength (0-100)
 */

interface PriceData {
  high: number;
  low: number;
  close: number;
  open: number;
}

/**
 * Detect HTF Trend
 * @param data - Array of price data (OHLC)
 * @returns TrendDetectorOutput with trend direction and strength
 */
export function detectTrend(data: PriceData[]): TrendDetectorOutput {
  logger.info('  🔍 Detecting HTF Trend...');

  if (!data || data.length < 3) {
    logger.warn('  ⚠ Insufficient data for trend detection');
    return { htfTrend: 'neutral', strength: 0 };
  }

  // Analyze recent price action (last 3-5 candles)
  const recentData = data.slice(-5);

  // Calculate higher highs and higher lows (bullish)
  const hasHigherHighs = checkHigherHighs(recentData);
  const hasHigherLows = checkHigherLows(recentData);

  // Calculate lower highs and lower lows (bearish)
  const hasLowerHighs = checkLowerHighs(recentData);
  const hasLowerLows = checkLowerLows(recentData);

  // Determine trend
  let htfTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let strength = 0;

  if (hasHigherHighs && hasHigherLows) {
    htfTrend = 'bullish';
    strength = calculateTrendStrength(recentData, 'bullish');
    logger.success(`  ✓ HTF Trend: BULLISH (Strength: ${strength}%)`);
  } else if (hasLowerHighs && hasLowerLows) {
    htfTrend = 'bearish';
    strength = calculateTrendStrength(recentData, 'bearish');
    logger.success(`  ✓ HTF Trend: BEARISH (Strength: ${strength}%)`);
  } else {
    logger.info('  → HTF Trend: NEUTRAL (Consolidation)');
    strength = 50; // Neutral strength
  }

  return { htfTrend, strength };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check for higher highs (bullish indicator)
 */
function checkHigherHighs(data: PriceData[]): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].high <= data[i - 1].high) {
      return false;
    }
  }
  return true;
}

/**
 * Check for higher lows (bullish indicator)
 */
function checkHigherLows(data: PriceData[]): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].low <= data[i - 1].low) {
      return false;
    }
  }
  return true;
}

/**
 * Check for lower highs (bearish indicator)
 */
function checkLowerHighs(data: PriceData[]): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].high >= data[i - 1].high) {
      return false;
    }
  }
  return true;
}

/**
 * Check for lower lows (bearish indicator)
 */
function checkLowerLows(data: PriceData[]): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i].low >= data[i - 1].low) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate trend strength (0-100)
 * Based on momentum and consistency
 */
function calculateTrendStrength(data: PriceData[], trend: 'bullish' | 'bearish'): number {
  const firstCandle = data[0];
  const lastCandle = data[data.length - 1];

  // Calculate price movement
  const priceChange =
    trend === 'bullish'
      ? lastCandle.close - firstCandle.close
      : firstCandle.close - lastCandle.close;

  const priceRange = firstCandle.high - firstCandle.low;

  // Normalize to 0-100
  const strength = Math.min(100, Math.max(0, (priceChange / priceRange) * 100));

  return Math.round(strength);
}
