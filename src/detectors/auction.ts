import { createLogger } from '@utils/agent_logger';

// Create logger for auction detector
const logger = createLogger('Auction-Detector');

/**
 * ═══════════════════════════════════════════════════════════════
 * AUCTION MARKET THEORY DETECTOR (For Fabio Playbook)
 * ═══════════════════════════════════════════════════════════════
 * Detects balance and imbalance zones based on Auction Market Theory.
 *
 * Key Concepts:
 *   - Balance: Market in consolidation (low volatility, tight range)
 *   - Imbalance: Market breakout/transition (gap, strong directional move)
 *
 * Strategy: Trade the transition from balance → imbalance
 */

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ═══════════════════════════════════════════════════════════════
// 1. BALANCE ZONE DETECTION
// ═══════════════════════════════════════════════════════════════

export interface BalanceZoneOutput {
  inBalance: boolean;
  range: {
    high: number;
    low: number;
    mid: number;
  } | null;
  duration: number; // Number of candles in balance
  volatility: 'low' | 'medium' | 'high';
}

/**
 * Detect Balance Zone (Consolidation)
 *
 * Balance characteristics:
 * - Low volatility (small candle bodies)
 * - Tight price range (high/low close together)
 * - Overlapping candles
 * - Low volume (optional)
 *
 * Algorithm:
 * 1. Calculate ATR (Average True Range) for recent candles
 * 2. If recent range < ATR threshold → in balance
 * 3. Count consecutive candles in balance
 *
 * @param candles - Array of candle data
 * @param lookback - Number of candles to analyze (default 10)
 * @returns BalanceZoneOutput with balance status and range
 */
export function detectBalanceZone(
  candles: CandleData[],
  lookback: number = 10
): BalanceZoneOutput {
  logger.info('  ⚖️  Detecting Balance Zone (Consolidation)...');

  if (candles.length < lookback) {
    logger.warn('      ✗ Insufficient candles for balance detection');
    return {
      inBalance: false,
      range: null,
      duration: 0,
      volatility: 'low',
    };
  }

  const recentCandles = candles.slice(-lookback);

  // Calculate range metrics
  const high = Math.max(...recentCandles.map((c) => c.high));
  const low = Math.min(...recentCandles.map((c) => c.low));
  const range = high - low;
  const mid = (high + low) / 2;

  // Calculate average candle body size
  const avgBody =
    recentCandles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / recentCandles.length;

  // Calculate average candle range
  const avgRange =
    recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length;

  // Calculate volatility
  const volatilityRatio = avgBody / avgRange;
  let volatility: 'low' | 'medium' | 'high';

  if (volatilityRatio < 0.3) {
    volatility = 'low';
  } else if (volatilityRatio < 0.6) {
    volatility = 'medium';
  } else {
    volatility = 'high';
  }

  // Balance detection criteria
  // 1. Small bodies relative to range (low volatility)
  // 2. Tight overall range
  const isLowVolatility = volatilityRatio < 0.35;
  const isTightRange = range / mid < 0.03; // Range < 3% of price

  const inBalance = isLowVolatility && isTightRange;

  // Count balance duration (consecutive candles meeting criteria)
  let duration = 0;
  for (let i = recentCandles.length - 1; i >= 0; i--) {
    const body = Math.abs(recentCandles[i].close - recentCandles[i].open);
    const candleRange = recentCandles[i].high - recentCandles[i].low;
    const candleVolatility = candleRange > 0 ? body / candleRange : 0;

    if (candleVolatility < 0.35) {
      duration++;
    } else {
      break;
    }
  }

  if (inBalance) {
    logger.success(
      `      ✓ BALANCE ZONE: ${low.toFixed(2)} - ${high.toFixed(2)} (${duration} candles)`
    );
    logger.info(`         Volatility: ${volatility.toUpperCase()}, Range: ${range.toFixed(2)}`);
  } else {
    logger.info('      → No balance zone (market trending/volatile)');
  }

  return {
    inBalance,
    range: { high, low, mid },
    duration,
    volatility,
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. IMBALANCE DETECTION - Re-exported from liquidity.ts
// ═══════════════════════════════════════════════════════════════

/**
 * Note: Imbalance detection is implemented in liquidity.ts as detectImbalance()
 * Import and use: import { detectImbalance } from '@detectors/liquidity'
 *
 * Imbalance = Price gap/jump between candles
 * - Gap up: current.low > prev.high
 * - Gap down: current.high < prev.low
 */

// Re-export for convenience
export { detectImbalance, ImbalanceOutput } from './liquidity';

// ═══════════════════════════════════════════════════════════════
// 3. AUCTION TRANSITION DETECTION (Balance → Imbalance)
// ═══════════════════════════════════════════════════════════════

export interface AuctionTransitionOutput {
  transitionDetected: boolean;
  fromBalance: boolean;
  toImbalance: boolean;
  direction: 'bullish' | 'bearish' | null;
  balanceRange: { high: number; low: number } | null;
  imbalanceSize: number;
}

/**
 * Detect Auction Transition (Balance → Imbalance)
 *
 * This is the CORE of Fabio playbook:
 * 1. Market consolidates in balance (tight range)
 * 2. Market breaks out with imbalance (gap or strong move)
 * 3. Trade in direction of breakout
 *
 * @param candles - Array of candle data
 * @returns AuctionTransitionOutput with transition status
 */
export function detectAuctionTransition(candles: CandleData[]): AuctionTransitionOutput {
  logger.info('  🔄 Detecting Auction Transition (Balance → Imbalance)...');

  if (candles.length < 8) {
    logger.warn('      ✗ Insufficient candles for transition detection');
    return {
      transitionDetected: false,
      fromBalance: false,
      toImbalance: false,
      direction: null,
      balanceRange: null,
      imbalanceSize: 0,
    };
  }

  // Check previous candles for balance (exclude most recent 2)
  const previousCandles = candles.slice(0, -2);
  const balanceZone = detectBalanceZone(previousCandles, Math.min(6, previousCandles.length));

  // Check recent candles for imbalance breakout
  const { detectImbalance } = require('./liquidity');
  const imbalance = detectImbalance(candles);

  // Transition criteria:
  // 1. Was in balance previously
  // 2. Now has imbalance (gap or strong move)
  const fromBalance = balanceZone.inBalance;
  const toImbalance = imbalance.detected;
  const transitionDetected = fromBalance && toImbalance;

  let direction: 'bullish' | 'bearish' | null = null;
  if (imbalance.type === 'gap_up') {
    direction = 'bullish';
  } else if (imbalance.type === 'gap_down') {
    direction = 'bearish';
  }

  if (transitionDetected) {
    logger.success(
      `      ✓ AUCTION TRANSITION: Balance → ${direction?.toUpperCase()} Imbalance`
    );
    logger.info(
      `         Balance Range: ${balanceZone.range?.low.toFixed(2)} - ${balanceZone.range?.high.toFixed(2)}`
    );
    logger.info(`         Imbalance Size: ${imbalance.size.toFixed(2)} points`);
  } else if (fromBalance && !toImbalance) {
    logger.info('      → Still in balance zone (no breakout yet)');
  } else if (!fromBalance && toImbalance) {
    logger.info('      → Imbalance detected but not from balance zone');
  } else {
    logger.info('      → No auction transition detected');
  }

  return {
    transitionDetected,
    fromBalance,
    toImbalance,
    direction,
    balanceRange: balanceZone.range ? { high: balanceZone.range.high, low: balanceZone.range.low } : null,
    imbalanceSize: imbalance.size,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate Average True Range (ATR)
 * Used for volatility measurement
 */
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period) {
    return 0;
  }

  const recentCandles = candles.slice(-period);
  let atr = 0;

  for (let i = 1; i < recentCandles.length; i++) {
    const current = recentCandles[i];
    const previous = recentCandles[i - 1];

    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    atr += trueRange;
  }

  return atr / (recentCandles.length - 1);
}

/**
 * Check if price is breaking out of balance range
 */
export function isBreakingOutOfBalance(
  currentPrice: number,
  balanceRange: { high: number; low: number }
): { breaking: boolean; direction: 'up' | 'down' | null } {
  if (currentPrice > balanceRange.high) {
    return { breaking: true, direction: 'up' };
  } else if (currentPrice < balanceRange.low) {
    return { breaking: true, direction: 'down' };
  } else {
    return { breaking: false, direction: null };
  }
}
