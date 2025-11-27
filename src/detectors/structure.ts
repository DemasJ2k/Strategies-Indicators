import { createLogger } from '@utils/agent_logger';
import { detectSwingHighsLows, SwingPoint } from './liquidity';

// Create logger for structure detector
const logger = createLogger('Structure-Detector');

/**
 * ═══════════════════════════════════════════════════════════════
 * MARKET STRUCTURE ENGINE
 * ═══════════════════════════════════════════════════════════════
 * Comprehensive market structure analysis including:
 *   - Break of Structure (BOS)
 *   - Market Structure Shift (MSS)
 *   - Order Blocks (OB)
 *   - Fair Value Gaps (FVG) - exported from liquidity.ts
 */

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ═══════════════════════════════════════════════════════════════
// 1. MARKET STRUCTURE SHIFT (MSS) & BREAK OF STRUCTURE (BOS)
// ═══════════════════════════════════════════════════════════════

export interface MarketStructureOutput {
  bos: boolean; // Break of Structure
  mss: boolean; // Market Structure Shift
  direction: 'bullish' | 'bearish' | null;
  level: number | null;
}

/**
 * Detect Market Structure Shift (MSS) and Break of Structure (BOS)
 *
 * Definitions:
 * - BOS (Break of Structure): Price breaks a recent swing high/low in the direction of trend
 *   Example: In uptrend, breaks above previous swing high
 *
 * - MSS (Market Structure Shift): Price breaks a COUNTER-TREND swing point, indicating trend reversal
 *   Example: In uptrend, breaks below previous swing low → bearish MSS
 *
 * @param candles - Array of candle data
 * @param htfTrend - Higher timeframe trend for context
 * @returns MarketStructureOutput with BOS/MSS status and direction
 */
export function detectMarketStructureShift(
  candles: CandleData[],
  htfTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
): MarketStructureOutput {
  logger.info('  🔄 Detecting Market Structure (BOS/MSS)...');

  if (candles.length < 5) {
    logger.warn('      ✗ Insufficient candles for structure detection');
    return { bos: false, mss: false, direction: null, level: null };
  }

  // Get swing points
  const swings = detectSwingHighsLows(candles);
  const currentCandle = candles[candles.length - 1];

  if (swings.swingHighs.length === 0 && swings.swingLows.length === 0) {
    logger.info('      → No swing points detected');
    return { bos: false, mss: false, direction: null, level: null };
  }

  // Find most recent swing high and low
  const recentSwingHigh =
    swings.swingHighs.length > 0
      ? swings.swingHighs[swings.swingHighs.length - 1]
      : null;
  const recentSwingLow =
    swings.swingLows.length > 0 ? swings.swingLows[swings.swingLows.length - 1] : null;

  // Check for BULLISH structure break
  if (recentSwingHigh && currentCandle.close > recentSwingHigh.level) {
    // If HTF is bullish, this is BOS (continuation)
    // If HTF is bearish, this is MSS (reversal)
    const isBOS = htfTrend === 'bullish';
    const isMSS = htfTrend === 'bearish';

    if (isBOS) {
      logger.success(
        `      ✓ BULLISH BOS: Broke above ${recentSwingHigh.level} (trend continuation)`
      );
    } else if (isMSS) {
      logger.success(
        `      ✓ BULLISH MSS: Broke above ${recentSwingHigh.level} (trend reversal)`
      );
    } else {
      logger.success(`      ✓ BULLISH Structure Break at ${recentSwingHigh.level}`);
    }

    return {
      bos: isBOS,
      mss: isMSS,
      direction: 'bullish',
      level: recentSwingHigh.level,
    };
  }

  // Check for BEARISH structure break
  if (recentSwingLow && currentCandle.close < recentSwingLow.level) {
    // If HTF is bearish, this is BOS (continuation)
    // If HTF is bullish, this is MSS (reversal)
    const isBOS = htfTrend === 'bearish';
    const isMSS = htfTrend === 'bullish';

    if (isBOS) {
      logger.success(
        `      ✓ BEARISH BOS: Broke below ${recentSwingLow.level} (trend continuation)`
      );
    } else if (isMSS) {
      logger.success(
        `      ✓ BEARISH MSS: Broke below ${recentSwingLow.level} (trend reversal)`
      );
    } else {
      logger.success(`      ✓ BEARISH Structure Break at ${recentSwingLow.level}`);
    }

    return {
      bos: isBOS,
      mss: isMSS,
      direction: 'bearish',
      level: recentSwingLow.level,
    };
  }

  logger.info('      → No structure break detected');
  return { bos: false, mss: false, direction: null, level: null };
}

// ═══════════════════════════════════════════════════════════════
// 2. ORDER BLOCK DETECTION
// ═══════════════════════════════════════════════════════════════

export interface OrderBlock {
  level: number;
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  index: number;
}

/**
 * Detect Order Blocks
 *
 * Definition:
 * - Bullish OB: Last DOWN candle before a strong bullish move
 * - Bearish OB: Last UP candle before a strong bearish move
 *
 * These are institutional zones where smart money placed orders.
 *
 * Algorithm:
 * 1. Find strong displacement moves (large candles)
 * 2. Identify the candle BEFORE the move
 * 3. That candle's range is the order block
 *
 * @param candles - Array of candle data
 * @returns Array of order blocks with level, type, and range
 */
export function detectOrderBlocks(candles: CandleData[]): OrderBlock[] {
  logger.info('  📦 Detecting Order Blocks...');

  if (candles.length < 4) {
    logger.warn('      ✗ Insufficient candles for order block detection');
    return [];
  }

  const orderBlocks: OrderBlock[] = [];
  const displacementThreshold = 0.7; // Body must be >70% of range

  for (let i = 1; i < candles.length - 1; i++) {
    const prevCandle = candles[i - 1];
    const currentCandle = candles[i];
    const nextCandle = candles[i + 1];

    const prevBody = Math.abs(prevCandle.close - prevCandle.open);
    const currentBody = Math.abs(currentCandle.close - currentCandle.open);
    const nextBody = Math.abs(nextCandle.close - nextCandle.open);
    const nextRange = nextCandle.high - nextCandle.low;

    // Check if next candle is a strong displacement move
    const isStrongMove = nextBody / nextRange > displacementThreshold;

    if (!isStrongMove) continue;

    // Bullish OB: Last down candle before bullish move
    if (nextCandle.close > nextCandle.open && currentCandle.close < currentCandle.open) {
      orderBlocks.push({
        level: (currentCandle.high + currentCandle.low) / 2,
        type: 'bullish',
        high: currentCandle.high,
        low: currentCandle.low,
        index: i,
      });
      logger.success(
        `      ✓ BULLISH Order Block: ${currentCandle.low} - ${currentCandle.high}`
      );
    }

    // Bearish OB: Last up candle before bearish move
    if (nextCandle.close < nextCandle.open && currentCandle.close > currentCandle.open) {
      orderBlocks.push({
        level: (currentCandle.high + currentCandle.low) / 2,
        type: 'bearish',
        high: currentCandle.high,
        low: currentCandle.low,
        index: i,
      });
      logger.success(
        `      ✓ BEARISH Order Block: ${currentCandle.low} - ${currentCandle.high}`
      );
    }
  }

  if (orderBlocks.length === 0) {
    logger.info('      → No order blocks detected');
  } else {
    logger.info(`      → ${orderBlocks.length} order block(s) found`);
  }

  return orderBlocks;
}

// ═══════════════════════════════════════════════════════════════
// 3. FAIR VALUE GAP (FVG) - Re-exported from liquidity.ts
// ═══════════════════════════════════════════════════════════════

/**
 * Note: FVG detection is implemented in liquidity.ts as detectFVG()
 * Import and use: import { detectFVG } from '@detectors/liquidity'
 *
 * FVG = Gap between candles (3-candle pattern)
 * - Bullish FVG: Candle 1 high < Candle 3 low
 * - Bearish FVG: Candle 1 low > Candle 3 high
 */

// Re-export for convenience
export { detectFVG, FVGOutput } from './liquidity';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if current price is at an order block
 */
export function isPriceAtOrderBlock(
  currentPrice: number,
  orderBlocks: OrderBlock[],
  tolerance: number = 0.001 // 0.1% tolerance
): OrderBlock | null {
  for (const ob of orderBlocks) {
    const range = ob.high - ob.low;
    const toleranceValue = range * tolerance;

    if (currentPrice >= ob.low - toleranceValue && currentPrice <= ob.high + toleranceValue) {
      return ob;
    }
  }

  return null;
}

/**
 * Get most recent order block of specific type
 */
export function getMostRecentOrderBlock(
  orderBlocks: OrderBlock[],
  type: 'bullish' | 'bearish'
): OrderBlock | null {
  const filtered = orderBlocks.filter((ob) => ob.type === type);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}
