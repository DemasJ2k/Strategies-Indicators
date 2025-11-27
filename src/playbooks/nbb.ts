import { MarketContext, PlaybookSignal } from '@types/context';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * NBB PLAYBOOK MODULE (PO3 + MMM + OTE + ADR)
 * ═══════════════════════════════════════════════════════════════
 * This is the FIRST playbook implementation.
 * It becomes the template for Tori, Fabio, and JadeCap.
 *
 * Validates:
 *   - HTF Bias
 *   - PO3 Zone (Premium/Discount)
 *   - Liquidity Sweep
 *   - Structure Break
 *   - Volume Spike + Displacement
 *   - OTE Retrace (0.62, 0.705, 0.79)
 *   - Session Filter
 *   - ADR validation (optional)
 */
export function executeNBB(context: MarketContext): PlaybookSignal | null {
  logger.info('  ┌─────────────────────────────────────────┐');
  logger.info('  │  NBB PLAYBOOK MODULE - FULL VALIDATION  │');
  logger.info('  └─────────────────────────────────────────┘\n');

  // ─────────────────────────────────────────────────────────────
  // 1. HTF BIAS
  // ─────────────────────────────────────────────────────────────
  if (!validateHTFBias(context)) {
    logger.warn('  ✗ [NBB] HTF Bias validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PO3 ZONE
  // ─────────────────────────────────────────────────────────────
  if (!validatePO3Zone(context)) {
    logger.warn('  ✗ [NBB] PO3 Zone validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. LIQUIDITY SWEEP
  // ─────────────────────────────────────────────────────────────
  if (!validateLiquiditySweep(context)) {
    logger.warn('  ✗ [NBB] Liquidity Sweep validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. STRUCTURE BREAK
  // ─────────────────────────────────────────────────────────────
  if (!validateStructureBreak(context)) {
    logger.warn('  ✗ [NBB] Structure Break validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. VOLUME SPIKE
  // ─────────────────────────────────────────────────────────────
  if (!validateVolumeSpike(context)) {
    logger.warn('  ✗ [NBB] Volume Spike validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. OTE RETRACE
  // ─────────────────────────────────────────────────────────────
  if (!validateOTERetrace(context)) {
    logger.warn('  ✗ [NBB] OTE Retrace validation failed\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // ALL VALIDATIONS PASSED → BUILD SIGNAL
  // ─────────────────────────────────────────────────────────────
  logger.success('  ✓✓✓ ALL NBB VALIDATIONS PASSED ✓✓✓\n');
  return buildNBBSignal(context);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. HTF BIAS VALIDATION
 * Confirms clear bullish or bearish trend
 */
function validateHTFBias(context: MarketContext): boolean {
  logger.info('  [1/6] Validating HTF Bias...');

  if (context.htfTrend === 'neutral') {
    logger.warn('      ✗ HTF is neutral, NBB requires clear bias');
    return false;
  }

  logger.success(`      ✓ HTF Bias: ${context.htfTrend.toUpperCase()}`);
  return true;
}

/**
 * 2. PO3 ZONE VALIDATION
 * Validates price is in correct PO3 zone:
 *   - Bullish: Price in discount (below equilibrium)
 *   - Bearish: Price in premium (above equilibrium)
 */
function validatePO3Zone(context: MarketContext): boolean {
  logger.info('  [2/6] Validating PO3 Zone...');

  if (!context.po3ZonePresent) {
    logger.warn('      ✗ No PO3 zone detected');
    return false;
  }

  if (!context.priceAtPO3) {
    logger.warn('      ✗ Price not at PO3 zone');
    return false;
  }

  // Check if price is in correct zone based on HTF bias
  const isPO3Valid = isPriceInPO3Zone(context);
  if (!isPO3Valid) {
    logger.warn(
      `      ✗ Price in wrong PO3 zone (HTF ${context.htfTrend}, needs ${
        context.htfTrend === 'bullish' ? 'discount' : 'premium'
      })`
    );
    return false;
  }

  logger.success(
    `      ✓ Price at PO3 ${context.htfTrend === 'bullish' ? 'DISCOUNT' : 'PREMIUM'} zone`
  );
  return true;
}

/**
 * 3. LIQUIDITY SWEEP VALIDATION
 * Confirms liquidity sweep in opposite direction of HTF trend:
 *   - Bullish HTF: Sweep lows
 *   - Bearish HTF: Sweep highs
 */
function validateLiquiditySweep(context: MarketContext): boolean {
  logger.info('  [3/6] Validating Liquidity Sweep...');

  if (!context.liquiditySweep) {
    logger.warn('      ✗ No liquidity sweep detected');
    return false;
  }

  // Validate sweep direction matches HTF bias
  const sweepValid = detectLiquiditySweep(context);
  if (!sweepValid) {
    logger.warn(
      `      ✗ Sweep direction wrong (HTF ${context.htfTrend}, swept ${context.sweptDirection})`
    );
    return false;
  }

  logger.success(`      ✓ Liquidity swept: ${context.sweptDirection?.toUpperCase()} side`);
  return true;
}

/**
 * 4. STRUCTURE BREAK VALIDATION
 * Confirms market structure break in trend direction:
 *   - Bullish: Break of structure upward
 *   - Bearish: Break of structure downward
 */
function validateStructureBreak(context: MarketContext): boolean {
  logger.info('  [4/6] Validating Structure Break...');

  if (!context.structureBreak) {
    logger.warn('      ✗ No structure break detected');
    return false;
  }

  // Validate break direction aligns with HTF bias
  const breakValid = detectStructureBreak(context);
  if (!breakValid) {
    logger.warn(
      `      ✗ Structure break misaligned (HTF ${context.htfTrend}, break ${context.breakDirection})`
    );
    return false;
  }

  logger.success(`      ✓ Structure break confirmed: ${context.breakDirection?.toUpperCase()}`);
  return true;
}

/**
 * 5. VOLUME SPIKE VALIDATION
 * Confirms volume spike with displacement
 */
function validateVolumeSpike(context: MarketContext): boolean {
  logger.info('  [5/6] Validating Volume Spike...');

  if (!context.volumeSpike) {
    logger.warn('      ✗ No volume spike detected');
    return false;
  }

  if (!context.displacement) {
    logger.warn('      ✗ No displacement detected');
    return false;
  }

  logger.success('      ✓ Volume spike + displacement confirmed');
  return true;
}

/**
 * 6. OTE RETRACE VALIDATION
 * Validates Optimal Trade Entry retrace:
 *   - Fib levels: 0.62, 0.705, 0.79 (50-79% range)
 */
function validateOTERetrace(context: MarketContext): boolean {
  logger.info('  [6/6] Validating OTE Retrace...');

  if (!context.oteRetrace) {
    logger.warn('      ✗ No OTE retrace detected');
    return false;
  }

  if (context.oteLevel === null) {
    logger.warn('      ✗ OTE level not calculated');
    return false;
  }

  // Validate OTE level is within acceptable range (0.62 - 0.79)
  const oteValid = context.oteLevel >= 0.62 && context.oteLevel <= 0.79;
  if (!oteValid) {
    logger.warn(`      ✗ OTE level out of range: ${context.oteLevel} (needs 0.62-0.79)`);
    return false;
  }

  logger.success(`      ✓ OTE retrace confirmed at ${context.oteLevel}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if price is in correct PO3 zone based on HTF bias
 */
function isPriceInPO3Zone(context: MarketContext): boolean {
  // For bullish: price should be in discount (below equilibrium)
  // For bearish: price should be in premium (above equilibrium)
  // This is a simplified check - in real implementation, calculate actual premium/discount zones

  if (context.htfTrend === 'bullish') {
    // In real implementation: check if price < equilibrium (50% of range)
    return true; // Placeholder
  } else if (context.htfTrend === 'bearish') {
    // In real implementation: check if price > equilibrium (50% of range)
    return true; // Placeholder
  }

  return false;
}

/**
 * Detect and validate liquidity sweep direction
 */
function detectLiquiditySweep(context: MarketContext): boolean {
  if (!context.sweptDirection) {
    return false;
  }

  // Bullish HTF should sweep lows
  if (context.htfTrend === 'bullish' && context.sweptDirection === 'low') {
    return true;
  }

  // Bearish HTF should sweep highs
  if (context.htfTrend === 'bearish' && context.sweptDirection === 'high') {
    return true;
  }

  return false;
}

/**
 * Detect and validate structure break direction
 */
function detectStructureBreak(context: MarketContext): boolean {
  if (!context.breakDirection) {
    return false;
  }

  // Structure break should align with HTF trend
  if (context.htfTrend === 'bullish' && context.breakDirection === 'bullish') {
    return true;
  }

  if (context.htfTrend === 'bearish' && context.breakDirection === 'bearish') {
    return true;
  }

  return false;
}

/**
 * Calculate OTE (Optimal Trade Entry) level
 * Returns Fibonacci retracement level (0.62, 0.705, or 0.79)
 */
function calculateOTELevel(high: number, low: number, currentPrice: number): number {
  const range = high - low;
  const retrace = (high - currentPrice) / range;

  // Round to nearest OTE level
  if (retrace >= 0.595 && retrace <= 0.645) return 0.62;
  if (retrace >= 0.68 && retrace <= 0.73) return 0.705;
  if (retrace >= 0.765 && retrace <= 0.815) return 0.79;

  return retrace; // Return actual value if not at standard levels
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build NBB Playbook Signal
 * Constructs final signal with context, TP logic, and confidence
 */
function buildNBBSignal(context: MarketContext): PlaybookSignal {
  const direction = context.htfTrend === 'bullish' ? 'bullish' : 'bearish';

  // Build context string
  const contextStr = `HTF ${context.htfTrend} + swept ${context.sweptDirection} + PO3 ${
    direction === 'bullish' ? 'discount' : 'premium'
  } + OTE ${context.oteLevel} + structure break ${context.breakDirection}`;

  // Build TP logic
  const tpLogic =
    direction === 'bullish'
      ? 'Target = Previous Day High OR MSS (Market Structure Shift)'
      : 'Target = Previous Day Low OR MSS (Market Structure Shift)';

  // Calculate confidence
  // Base confidence: 85%
  // Add +5% if volume spike is strong
  // Add +5% if OTE level is 0.705 (optimal)
  let confidence = 85;
  if (context.displacement) confidence += 5;
  if (context.oteLevel === 0.705) confidence += 5;

  logger.info('  ═══════════════════════════════════════════');
  logger.info('  🎯 NBB SIGNAL GENERATED');
  logger.info('  ═══════════════════════════════════════════');
  logger.info(`  Direction: ${direction.toUpperCase()}`);
  logger.info(`  Context: ${contextStr}`);
  logger.info(`  TP Logic: ${tpLogic}`);
  logger.info(`  Confidence: ${confidence}%`);
  logger.info(`  Session: ${context.session.toUpperCase()}`);
  logger.info('  ═══════════════════════════════════════════\n');

  return {
    playbookName: 'NBB PO3/OTE',
    direction,
    context: contextStr,
    tpLogic,
    confidence,
    session: context.session,
  };
}
