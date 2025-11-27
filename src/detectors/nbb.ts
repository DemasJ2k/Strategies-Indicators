import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * NBB-SPECIFIC DETECTORS
 * ═══════════════════════════════════════════════════════════════
 * These detectors power the NBB (Market Maker Model) playbook.
 *
 * Includes:
 *   - Market Maker Model (MMM) - Accumulation → Manipulation → Distribution
 *   - Breaker Block Detection
 *   - PO3 Zone Detection (Premium/Discount)
 *   - OTE Level Detection (50-79% retracement)
 */

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ═══════════════════════════════════════════════════════════════
// 1. MARKET MAKER MODEL (MMM) DETECTION
// ═══════════════════════════════════════════════════════════════

export interface MMMOutput {
  phase: 'accumulation' | 'manipulation' | 'distribution' | 'none';
  level: number | null;
  confidence: number;
}

/**
 * Detect Market Maker Model Phase
 * MMM: Accumulation → Manipulation (sweep) → Distribution (expansion)
 */
export function detectMMM(candles: CandleData[]): MMMOutput {
  logger.info('  📊 Detecting Market Maker Model (MMM)...');

  if (candles.length < 5) {
    logger.warn('      ✗ Insufficient candles for MMM detection');
    return { phase: 'none', level: null, confidence: 0 };
  }

  const recent = candles.slice(-5);

  // Check for accumulation (consolidation/range)
  const isAccumulation = checkAccumulation(recent);
  if (isAccumulation) {
    logger.info('      → Phase: ACCUMULATION (ranging)');
    return {
      phase: 'accumulation',
      level: (recent[recent.length - 1].high + recent[recent.length - 1].low) / 2,
      confidence: 70,
    };
  }

  // Check for manipulation (liquidity sweep - wick beyond range then reversal)
  const manipulation = checkManipulation(recent);
  if (manipulation.detected) {
    logger.success('      ✓ Phase: MANIPULATION (sweep detected)');
    return {
      phase: 'manipulation',
      level: manipulation.level,
      confidence: 85,
    };
  }

  // Check for distribution (strong expansion after manipulation)
  const isDistribution = checkDistribution(recent);
  if (isDistribution) {
    logger.success('      ✓ Phase: DISTRIBUTION (expansion)');
    return {
      phase: 'distribution',
      level: recent[recent.length - 1].close,
      confidence: 80,
    };
  }

  logger.info('      → No clear MMM phase detected');
  return { phase: 'none', level: null, confidence: 0 };
}

function checkAccumulation(candles: CandleData[]): boolean {
  // Accumulation: tight range, small candle bodies
  const range = Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low));
  const avgBody =
    candles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / candles.length;

  // Small bodies relative to range indicates accumulation
  return avgBody / range < 0.3;
}

function checkManipulation(candles: CandleData[]): { detected: boolean; level: number | null } {
  // Manipulation: wick sweep beyond previous level then close inside
  const lastCandle = candles[candles.length - 1];
  const prevCandles = candles.slice(0, -1);
  const prevHigh = Math.max(...prevCandles.map((c) => c.high));
  const prevLow = Math.min(...prevCandles.map((c) => c.low));

  // Check for high sweep (wick above but close below)
  if (lastCandle.high > prevHigh && lastCandle.close < prevHigh) {
    return { detected: true, level: prevHigh };
  }

  // Check for low sweep (wick below but close above)
  if (lastCandle.low < prevLow && lastCandle.close > prevLow) {
    return { detected: true, level: prevLow };
  }

  return { detected: false, level: null };
}

function checkDistribution(candles: CandleData[]): boolean {
  // Distribution: large candle bodies after manipulation
  const lastCandle = candles[candles.length - 1];
  const body = Math.abs(lastCandle.close - lastCandle.open);
  const range = lastCandle.high - lastCandle.low;

  // Large body (>70% of range) indicates distribution
  return body / range > 0.7;
}

// ═══════════════════════════════════════════════════════════════
// 2. BREAKER BLOCK DETECTION
// ═══════════════════════════════════════════════════════════════

export interface BreakerBlockOutput {
  exists: boolean;
  level: number | null;
  type: 'bullish' | 'bearish' | null;
  strength: number;
}

/**
 * Detect Breaker Blocks
 * Breaker = Zone where structure was broken (old support becomes resistance, or vice versa)
 */
export function detectBreakerBlock(candles: CandleData[]): BreakerBlockOutput {
  logger.info('  🔨 Detecting Breaker Blocks...');

  if (candles.length < 4) {
    logger.warn('      ✗ Insufficient candles for breaker block detection');
    return { exists: false, level: null, type: null, strength: 0 };
  }

  // Find structure break (break of previous high/low)
  for (let i = candles.length - 1; i >= 2; i--) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prevPrev = candles[i - 2];

    // Bullish breaker: broke above previous high
    if (current.close > prevPrev.high && prev.close <= prevPrev.high) {
      const level = prevPrev.high;
      logger.success(`      ✓ BULLISH Breaker Block at ${level}`);
      return {
        exists: true,
        level,
        type: 'bullish',
        strength: 75,
      };
    }

    // Bearish breaker: broke below previous low
    if (current.close < prevPrev.low && prev.close >= prevPrev.low) {
      const level = prevPrev.low;
      logger.success(`      ✓ BEARISH Breaker Block at ${level}`);
      return {
        exists: true,
        level,
        type: 'bearish',
        strength: 75,
      };
    }
  }

  logger.info('      → No breaker block detected');
  return { exists: false, level: null, type: null, strength: 0 };
}

// ═══════════════════════════════════════════════════════════════
// 3. PO3 ZONE DETECTION (Premium/Discount)
// ═══════════════════════════════════════════════════════════════

export interface PO3Output {
  exists: boolean;
  inPremium: boolean;
  inDiscount: boolean;
  level: number;
  equilibrium: number;
}

/**
 * Detect PO3 Zones (Premium/Discount)
 * Premium = above 50% (equilibrium)
 * Discount = below 50% (equilibrium)
 */
export function detectPO3Zone(
  candles: CandleData[],
  htfTrend: 'bullish' | 'bearish' | 'neutral'
): PO3Output {
  logger.info('  💎 Detecting PO3 Zones (Premium/Discount)...');

  if (candles.length < 2) {
    logger.warn('      ✗ Insufficient candles for PO3 detection');
    return {
      exists: false,
      inPremium: false,
      inDiscount: false,
      level: 0,
      equilibrium: 0,
    };
  }

  // Calculate range from recent swing high/low
  const recentCandles = candles.slice(-10);
  const high = Math.max(...recentCandles.map((c) => c.high));
  const low = Math.min(...recentCandles.map((c) => c.low));
  const range = high - low;
  const equilibrium = low + range * 0.5; // 50% level

  const currentPrice = candles[candles.length - 1].close;

  // Determine if in premium or discount
  const inPremium = currentPrice > equilibrium;
  const inDiscount = currentPrice < equilibrium;

  if (htfTrend !== 'neutral') {
    if (inPremium) {
      logger.info(`      → Price in PREMIUM zone (above ${equilibrium.toFixed(2)})`);
    } else if (inDiscount) {
      logger.success(`      ✓ Price in DISCOUNT zone (below ${equilibrium.toFixed(2)})`);
    }

    return {
      exists: true,
      inPremium,
      inDiscount,
      level: currentPrice,
      equilibrium,
    };
  }

  logger.info('      → HTF neutral, PO3 zones not applicable');
  return {
    exists: false,
    inPremium: false,
    inDiscount: false,
    level: currentPrice,
    equilibrium,
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. OTE ZONE AVAILABILITY (50-79% retracement)
// ═══════════════════════════════════════════════════════════════

export interface OTEOutput {
  available: boolean;
  level: number | null;
  percentage: number | null;
}

/**
 * Detect OTE Level (Optimal Trade Entry)
 * OTE = 0.62, 0.705, or 0.79 Fibonacci retracement
 */
export function detectOTELevel(
  candles: CandleData[],
  htfTrend: 'bullish' | 'bearish' | 'neutral'
): OTEOutput {
  logger.info('  🎯 Detecting OTE Level (50-79% retracement)...');

  if (candles.length < 3 || htfTrend === 'neutral') {
    logger.warn('      ✗ Insufficient data or neutral trend for OTE detection');
    return { available: false, level: null, percentage: null };
  }

  const recentCandles = candles.slice(-10);
  const high = Math.max(...recentCandles.map((c) => c.high));
  const low = Math.min(...recentCandles.map((c) => c.low));
  const range = high - low;
  const currentPrice = candles[candles.length - 1].close;

  // Calculate retracement percentage
  const retracement = htfTrend === 'bullish' ? (high - currentPrice) / range : (currentPrice - low) / range;

  // Check if within OTE range (0.62 - 0.79)
  if (retracement >= 0.62 && retracement <= 0.79) {
    // Determine closest Fibonacci level
    let fibLevel: number;
    if (retracement >= 0.595 && retracement <= 0.645) {
      fibLevel = 0.62;
    } else if (retracement >= 0.68 && retracement <= 0.73) {
      fibLevel = 0.705;
    } else if (retracement >= 0.765 && retracement <= 0.815) {
      fibLevel = 0.79;
    } else {
      fibLevel = Math.round(retracement * 1000) / 1000;
    }

    logger.success(`      ✓ OTE Level: ${fibLevel} (${(retracement * 100).toFixed(1)}% retracement)`);

    return {
      available: true,
      level: fibLevel,
      percentage: retracement,
    };
  }

  logger.info(`      → Price not in OTE zone (${(retracement * 100).toFixed(1)}% retracement)`);
  return { available: false, level: null, percentage: retracement };
}
