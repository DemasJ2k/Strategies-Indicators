import { MarketContext, PlaybookSignal } from '@custom-types/context';
import { logger } from '@utils/logger';
// Import real trendline detectors
import {
  detectAscendingTrendline,
  detectDescendingTrendline,
  isTrendlineRespected,
} from '@detectors/trendline';

/**
 * ═══════════════════════════════════════════════════════════════
 * TORI TRENDLINE PLAYBOOK MODULE
 * ═══════════════════════════════════════════════════════════════
 * Focuses on clean trendline plays with strong structure.
 *
 * Validates:
 *   - HTF trendline alignment (4H trendline)
 *   - Trendline respected (2-3+ touches)
 *   - Clean structure (no heavy imbalance below/above)
 *   - Session timing
 */

/**
 * Check Tori Playbook (Main Entry Point for Classifier)
 * @param context - Market context from buildMarketContext()
 * @returns PlaybookSignal or null if conditions not met
 */
export function checkTori(context: MarketContext): PlaybookSignal | null {
  return executeTori(context);
}

export function executeTori(context: MarketContext): PlaybookSignal | null {
  logger.info('  ┌─────────────────────────────────────────┐');
  logger.info('  │  TORI TRENDLINE PLAYBOOK - VALIDATION   │');
  logger.info('  └─────────────────────────────────────────┘\n');

  // ─────────────────────────────────────────────────────────────
  // 1. HTF TRENDLINE ALIGNMENT
  // ─────────────────────────────────────────────────────────────
  if (!validateHTFTrendlineAlignment(context)) {
    logger.warn('  ✗ [TORI] HTF Trendline alignment failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TRENDLINE RESPECTED
  // ─────────────────────────────────────────────────────────────
  if (!validateTrendlineRespected(context)) {
    logger.warn('  ✗ [TORI] Trendline not sufficiently respected\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CLEAN STRUCTURE
  // ─────────────────────────────────────────────────────────────
  if (!validateCleanStructure(context)) {
    logger.warn('  ✗ [TORI] Structure not clean (heavy imbalance detected)\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SESSION TIMING
  // ─────────────────────────────────────────────────────────────
  if (!validateSessionTiming(context)) {
    logger.warn('  ✗ [TORI] Session timing not optimal\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // ALL VALIDATIONS PASSED → BUILD SIGNAL
  // ─────────────────────────────────────────────────────────────
  logger.success('  ✓✓✓ ALL TORI VALIDATIONS PASSED ✓✓✓\n');
  return buildToriSignal(context);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. HTF TRENDLINE ALIGNMENT
 * Validates 4H trendline exists and aligns with HTF bias
 */
function validateHTFTrendlineAlignment(context: MarketContext): boolean {
  logger.info('  [1/4] Validating HTF Trendline Alignment...');

  if (!context.trendline.exists) {
    logger.warn('      ✗ No trendline detected');
    return false;
  }

  // HTF trend should not be neutral
  if (context.htfTrend === 'neutral') {
    logger.warn('      ✗ HTF trend is neutral, Tori requires clear bias');
    return false;
  }

  logger.success(`      ✓ Trendline exists, aligned with HTF ${context.htfTrend.toUpperCase()}`);
  return true;
}

/**
 * 2. TRENDLINE RESPECTED
 * Validates trendline has been touched and respected 2-3+ times
 */
function validateTrendlineRespected(context: MarketContext): boolean {
  logger.info('  [2/4] Validating Trendline Respect...');

  if (!context.trendline.respected) {
    logger.warn('      ✗ Trendline not respected');
    return false;
  }

  // Require at least 2 touches (preferably 3+)
  if (context.trendline.touches < 2) {
    logger.warn(`      ✗ Insufficient touches: ${context.trendline.touches} (need 2+)`);
    return false;
  }

  logger.success(
    `      ✓ Trendline respected with ${context.trendline.touches} touch${
      context.trendline.touches > 1 ? 'es' : ''
    }`
  );
  return true;
}

/**
 * 3. CLEAN STRUCTURE
 * Validates no heavy imbalance exists that could invalidate the setup
 */
function validateCleanStructure(context: MarketContext): boolean {
  logger.info('  [3/4] Validating Clean Structure...');

  // Check for balance zones - should NOT be in heavy imbalance
  if (context.balanceZones.inBalance === false) {
    logger.warn('      ✗ Market in imbalance, structure not clean');
    return false;
  }

  logger.success('      ✓ Clean structure confirmed (no heavy imbalance)');
  return true;
}

/**
 * 4. SESSION TIMING
 * Validates optimal session for Tori plays (London or NY preferred)
 */
function validateSessionTiming(context: MarketContext): boolean {
  logger.info('  [4/4] Validating Session Timing...');

  // Tori plays work best during London and NY sessions
  if (context.session !== 'london' && context.session !== 'ny') {
    logger.warn(`      ✗ Suboptimal session: ${context.session} (prefer London/NY)`);
    return false;
  }

  logger.success(`      ✓ Optimal session: ${context.session.toUpperCase()}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Detect trendline direction based on HTF bias
 */
function detectTrendlineDirection(context: MarketContext): 'ascending' | 'descending' | null {
  if (context.htfTrend === 'bullish') {
    return 'ascending';
  } else if (context.htfTrend === 'bearish') {
    return 'descending';
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build Tori Playbook Signal
 */
function buildToriSignal(context: MarketContext): PlaybookSignal {
  const direction = context.htfTrend === 'bullish' ? 'bullish' : 'bearish';
  const trendlineDir = detectTrendlineDirection(context);

  // Build context string
  const contextStr = `${trendlineDir} trendline + ${context.trendline.touches} touches + HTF ${context.htfTrend} + clean structure`;

  // Build TP logic
  const tpLogic =
    direction === 'bullish'
      ? 'Target = Recent swing high OR next resistance level'
      : 'Target = Recent swing low OR next support level';

  // Calculate confidence
  let confidence = 80;
  if (context.trendline.touches >= 3) confidence += 10; // Strong trendline
  if (context.session === 'ny') confidence += 5; // Optimal session

  logger.info('  ═══════════════════════════════════════════');
  logger.info('  🎯 TORI SIGNAL GENERATED');
  logger.info('  ═══════════════════════════════════════════');
  logger.info(`  Direction: ${direction.toUpperCase()}`);
  logger.info(`  Context: ${contextStr}`);
  logger.info(`  TP Logic: ${tpLogic}`);
  logger.info(`  Confidence: ${confidence}%`);
  logger.info(`  Session: ${context.session.toUpperCase()}`);
  logger.info('  ═══════════════════════════════════════════\n');

  return {
    playbookName: 'Tori Trendline',
    direction,
    context: contextStr,
    tpLogic,
    confidence,
    session: context.session,
  };
}
