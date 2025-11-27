import { createLogger } from '@utils/agent_logger';

// Create logger for trendline detector
const logger = createLogger('Trendline-Detector');

/**
 * ═══════════════════════════════════════════════════════════════
 * TRENDLINE DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Identifies and validates trendlines.
 *
 * Detects:
 *   - Ascending trendlines (support)
 *   - Descending trendlines (resistance)
 *   - Number of touches
 *   - Whether trendline is being respected
 */

interface PriceData {
  high: number;
  low: number;
  close: number;
  time?: number;
}

interface TrendlineOutput {
  exists: boolean;
  touches: number;
  respected: boolean;
  type?: 'ascending' | 'descending';
  slope?: number;
}

/**
 * Detect Trendline
 * @param data - Array of price data
 * @param htfTrend - Higher timeframe trend for validation
 * @returns Trendline object
 */
export function detectTrendline(
  data: PriceData[],
  htfTrend?: 'bullish' | 'bearish' | 'neutral'
): TrendlineOutput {
  logger.info('  📈 Detecting Trendlines...');

  if (!data || data.length < 3) {
    logger.warn('  ⚠ Insufficient data for trendline detection');
    return {
      exists: false,
      touches: 0,
      respected: false,
    };
  }

  // Detect ascending trendline (support) for bullish trends
  const ascendingTrendline = detectAscendingTrendline(data);

  // Detect descending trendline (resistance) for bearish trends
  const descendingTrendline = detectDescendingTrendline(data);

  // Choose trendline based on HTF trend
  let trendline: TrendlineOutput;

  if (htfTrend === 'bullish' && ascendingTrendline.exists) {
    trendline = ascendingTrendline;
    logger.success(
      `  ✓ Ascending Trendline: ${trendline.touches} touches, respected: ${trendline.respected}`
    );
  } else if (htfTrend === 'bearish' && descendingTrendline.exists) {
    trendline = descendingTrendline;
    logger.success(
      `  ✓ Descending Trendline: ${trendline.touches} touches, respected: ${trendline.respected}`
    );
  } else if (ascendingTrendline.touches >= descendingTrendline.touches) {
    trendline = ascendingTrendline;
    if (trendline.exists) {
      logger.info(`  → Ascending Trendline detected (${trendline.touches} touches)`);
    }
  } else {
    trendline = descendingTrendline;
    if (trendline.exists) {
      logger.info(`  → Descending Trendline detected (${trendline.touches} touches)`);
    }
  }

  if (!trendline.exists) {
    logger.info('  → No valid trendline detected');
  }

  return trendline;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Detect ascending trendline (support line)
 * Connects higher lows
 */
export function detectAscendingTrendline(data: PriceData[]): TrendlineOutput {
  const lows = data.map((c) => c.low);

  // Find swing lows (local minima)
  const swingLows: Array<{ index: number; value: number }> = [];
  for (let i = 1; i < lows.length - 1; i++) {
    if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
      swingLows.push({ index: i, value: lows[i] });
    }
  }

  if (swingLows.length < 2) {
    return { exists: false, touches: 0, respected: false };
  }

  // Check if lows are ascending
  let touches = 0;
  let ascending = true;

  for (let i = 1; i < swingLows.length; i++) {
    if (swingLows[i].value > swingLows[i - 1].value) {
      touches++;
    } else {
      ascending = false;
      break;
    }
  }

  if (!ascending || touches < 2) {
    return { exists: false, touches, respected: false };
  }

  // Check if recent price respects the trendline
  const recentLow = lows[lows.length - 1];
  const lastSwingLow = swingLows[swingLows.length - 1].value;
  const respected = recentLow >= lastSwingLow * 0.98; // Within 2% tolerance

  return {
    exists: true,
    touches: touches + 1, // +1 for initial point
    respected,
    type: 'ascending',
  };
}

/**
 * Detect descending trendline (resistance line)
 * Connects lower highs
 */
export function detectDescendingTrendline(data: PriceData[]): TrendlineOutput {
  const highs = data.map((c) => c.high);

  // Find swing highs (local maxima)
  const swingHighs: Array<{ index: number; value: number }> = [];
  for (let i = 1; i < highs.length - 1; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
      swingHighs.push({ index: i, value: highs[i] });
    }
  }

  if (swingHighs.length < 2) {
    return { exists: false, touches: 0, respected: false };
  }

  // Check if highs are descending
  let touches = 0;
  let descending = true;

  for (let i = 1; i < swingHighs.length; i++) {
    if (swingHighs[i].value < swingHighs[i - 1].value) {
      touches++;
    } else {
      descending = false;
      break;
    }
  }

  if (!descending || touches < 2) {
    return { exists: false, touches, respected: false };
  }

  // Check if recent price respects the trendline
  const recentHigh = highs[highs.length - 1];
  const lastSwingHigh = swingHighs[swingHighs.length - 1].value;
  const respected = recentHigh <= lastSwingHigh * 1.02; // Within 2% tolerance

  return {
    exists: true,
    touches: touches + 1, // +1 for initial point
    respected,
    type: 'descending',
  };
}

/**
 * Check if trendline is being respected
 * @param trendlineOutput - Result from detectTrendline
 * @returns boolean indicating if trendline is respected
 */
export function isTrendlineRespected(trendlineOutput: TrendlineOutput): boolean {
  return trendlineOutput.exists && trendlineOutput.respected;
}
