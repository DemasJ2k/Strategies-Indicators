import { MarketContext, PlaybookSignal } from '@types/context';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * FABIO AUCTION MARKET PLAYBOOK MODULE
 * ═══════════════════════════════════════════════════════════════
 * Focuses on Balance → Imbalance transitions with volume profile.
 *
 * Validates:
 *   - Balance → Imbalance transition
 *   - LVN (Low Volume Node) detected
 *   - Footprint aggression
 *   - Orderflow confirmation or rejection
 */
export function executeFabio(context: MarketContext): PlaybookSignal | null {
  logger.info('  ┌─────────────────────────────────────────┐');
  logger.info('  │  FABIO AUCTION MARKET - VALIDATION      │');
  logger.info('  └─────────────────────────────────────────┘\n');

  // ─────────────────────────────────────────────────────────────
  // 1. BALANCE → IMBALANCE TRANSITION
  // ─────────────────────────────────────────────────────────────
  if (!validateBalanceToImbalance(context)) {
    logger.warn('  ✗ [FABIO] Balance → Imbalance transition not detected\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LVN DETECTED
  // ─────────────────────────────────────────────────────────────
  if (!validateLVNDetected(context)) {
    logger.warn('  ✗ [FABIO] Low Volume Node not detected\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FOOTPRINT AGGRESSION
  // ─────────────────────────────────────────────────────────────
  if (!validateFootprintAggression(context)) {
    logger.warn('  ✗ [FABIO] Footprint aggression not confirmed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ORDERFLOW CONFIRMATION
  // ─────────────────────────────────────────────────────────────
  if (!validateOrderflow(context)) {
    logger.warn('  ✗ [FABIO] Orderflow not confirmed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // ALL VALIDATIONS PASSED → BUILD SIGNAL
  // ─────────────────────────────────────────────────────────────
  logger.success('  ✓✓✓ ALL FABIO VALIDATIONS PASSED ✓✓✓\n');
  return buildFabioSignal(context);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. BALANCE → IMBALANCE TRANSITION
 * Validates market moving from balance to imbalance state
 */
function validateBalanceToImbalance(context: MarketContext): boolean {
  logger.info('  [1/4] Validating Balance → Imbalance Transition...');

  // Must transition from balance to imbalance
  if (context.balanceZones.inBalance === true) {
    logger.warn('      ✗ Market still in balance, waiting for imbalance');
    return false;
  }

  logger.success('      ✓ Balance → Imbalance transition confirmed');
  return true;
}

/**
 * 2. LVN DETECTED
 * Validates Low Volume Node presence (critical for Fabio plays)
 */
function validateLVNDetected(context: MarketContext): boolean {
  logger.info('  [2/4] Validating LVN (Low Volume Node)...');

  if (!context.balanceZones.lvnDetected) {
    logger.warn('      ✗ No LVN detected in volume profile');
    return false;
  }

  logger.success('      ✓ LVN detected in volume profile');
  return true;
}

/**
 * 3. FOOTPRINT AGGRESSION
 * Validates aggressive buying/selling in footprint chart
 */
function validateFootprintAggression(context: MarketContext): boolean {
  logger.info('  [3/4] Validating Footprint Aggression...');

  // Check for displacement (aggressive move)
  if (!context.displacement) {
    logger.warn('      ✗ No displacement/aggression detected');
    return false;
  }

  // Volume spike indicates aggressive participation
  if (!context.volumeSpike) {
    logger.warn('      ✗ No volume spike to support aggression');
    return false;
  }

  logger.success('      ✓ Footprint aggression confirmed (displacement + volume)');
  return true;
}

/**
 * 4. ORDERFLOW CONFIRMATION
 * Validates orderflow confirms continuation or shows rejection
 */
function validateOrderflow(context: MarketContext): boolean {
  logger.info('  [4/4] Validating Orderflow...');

  // Orderflow should show structure break in trend direction
  if (!context.structureBreak) {
    logger.warn('      ✗ No structure break to confirm orderflow');
    return false;
  }

  // HTF bias should align with orderflow
  if (context.htfTrend === 'neutral') {
    logger.warn('      ✗ HTF neutral, need clear bias for orderflow confirmation');
    return false;
  }

  logger.success(`      ✓ Orderflow confirmed: ${context.htfTrend.toUpperCase()} continuation`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Detect imbalance direction based on HTF and structure
 */
function detectImbalanceDirection(context: MarketContext): 'bullish' | 'bearish' {
  if (context.htfTrend === 'bullish' && context.breakDirection === 'bullish') {
    return 'bullish';
  } else if (context.htfTrend === 'bearish' && context.breakDirection === 'bearish') {
    return 'bearish';
  }
  // Default to HTF trend
  return context.htfTrend === 'bullish' ? 'bullish' : 'bearish';
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build Fabio Playbook Signal
 */
function buildFabioSignal(context: MarketContext): PlaybookSignal {
  const direction = detectImbalanceDirection(context);

  // Build context string
  const contextStr = `Balance → Imbalance + LVN detected + footprint aggression + orderflow ${direction}`;

  // Build TP logic
  const tpLogic =
    direction === 'bullish'
      ? 'Target = Value Area High (VAH) OR imbalance fill'
      : 'Target = Value Area Low (VAL) OR imbalance fill';

  // Calculate confidence
  let confidence = 78;
  if (context.volumeSpike && context.displacement) confidence += 10; // Strong aggression
  if (context.balanceZones.lvnDetected) confidence += 7; // Clear LVN

  logger.info('  ═══════════════════════════════════════════');
  logger.info('  🎯 FABIO SIGNAL GENERATED');
  logger.info('  ═══════════════════════════════════════════');
  logger.info(`  Direction: ${direction.toUpperCase()}`);
  logger.info(`  Context: ${contextStr}`);
  logger.info(`  TP Logic: ${tpLogic}`);
  logger.info(`  Confidence: ${confidence}%`);
  logger.info(`  Session: ${context.session.toUpperCase()}`);
  logger.info('  ═══════════════════════════════════════════\n');

  return {
    playbookName: 'Fabio Auction Market',
    direction,
    context: contextStr,
    tpLogic,
    confidence,
    session: context.session,
  };
}
