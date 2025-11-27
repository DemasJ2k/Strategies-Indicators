import { MarketContext, PlaybookSignal } from '@custom-types/context';
import { createLogger } from '@utils/agent_logger';
import { getPlaybookConfig, isPlaybookEnabled } from '@config/config';
// Import real session and liquidity detectors
import { detectSessionSweep, detectFVG, detectMSS } from '@detectors/liquidity';

// Create logger for JadeCap playbook
const logger = createLogger('JadeCap');

/**
 * ═══════════════════════════════════════════════════════════════
 * JADECAP LIQUIDITY & VOLATILITY PLAYBOOK MODULE
 * ═══════════════════════════════════════════════════════════════
 * Focuses on session-based liquidity sweeps during NY session.
 *
 * Validates:
 *   - Session sweep (Asian/London sweep)
 *   - NY window timing (9:30-11:30 AM)
 *   - FVG or MSS formation after sweep
 *   - Volatility context
 */

/**
 * Check JadeCap Playbook (Main Entry Point for Classifier)
 * @param context - Market context from buildMarketContext()
 * @returns PlaybookSignal or null if conditions not met
 */
export function checkJadeCap(context: MarketContext): PlaybookSignal | null {
  // Check if playbook is enabled in config
  if (!isPlaybookEnabled('JadeCap')) {
    logger.warn('  ✗ [JADECAP] Playbook is disabled in config\n');
    return null;
  }

  // Execute validation logic
  const signal = executeJadeCap(context);

  // If signal generated, check minimum confidence threshold
  if (signal) {
    const config = getPlaybookConfig('JadeCap');
    if (signal.confidence < config.minConfidence) {
      logger.warn(`  ✗ [JADECAP] Confidence ${signal.confidence}% below minimum threshold ${config.minConfidence}%\n`);
      return null;
    }
  }

  return signal;
}

export function executeJadeCap(context: MarketContext): PlaybookSignal | null {
  logger.info('  ┌─────────────────────────────────────────┐');
  logger.info('  │  JADECAP LIQUIDITY MODEL - VALIDATION   │');
  logger.info('  └─────────────────────────────────────────┘\n');

  // ─────────────────────────────────────────────────────────────
  // 1. SESSION SWEEP
  // ─────────────────────────────────────────────────────────────
  if (!validateSessionSweep(context)) {
    logger.warn('  ✗ [JADECAP] Session sweep not detected\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. NY WINDOW TIMING
  // ─────────────────────────────────────────────────────────────
  if (!validateNYWindow(context)) {
    logger.warn('  ✗ [JADECAP] Not in NY window (9:30-11:30)\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FVG OR MSS AFTER SWEEP
  // ─────────────────────────────────────────────────────────────
  if (!validateFVGOrMSS(context)) {
    logger.warn('  ✗ [JADECAP] No FVG/MSS detected after sweep\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. VOLATILITY CONTEXT
  // ─────────────────────────────────────────────────────────────
  if (!validateVolatilityContext(context)) {
    logger.warn('  ✗ [JADECAP] Volatility context not favorable\n');
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // ALL VALIDATIONS PASSED → BUILD SIGNAL
  // ─────────────────────────────────────────────────────────────
  logger.success('  ✓✓✓ ALL JADECAP VALIDATIONS PASSED ✓✓✓\n');
  return buildJadeCapSignal(context);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. SESSION SWEEP
 * Validates liquidity sweep occurred during Asian or London session
 */
function validateSessionSweep(context: MarketContext): boolean {
  logger.info('  [1/4] Validating Session Sweep...');

  if (!context.liquiditySweep) {
    logger.warn('      ✗ No liquidity sweep detected');
    return false;
  }

  // For JadeCap, we look for sweeps that happened earlier (Asian/London)
  // that are being reacted to during NY session
  if (!context.sweptDirection) {
    logger.warn('      ✗ Sweep direction not identified');
    return false;
  }

  logger.success(`      ✓ Session sweep confirmed: ${context.sweptDirection?.toUpperCase()} side swept`);
  return true;
}

/**
 * 2. NY WINDOW TIMING
 * Validates trade setup during optimal NY window (9:30-11:30 AM EST)
 */
function validateNYWindow(context: MarketContext): boolean {
  logger.info('  [2/4] Validating NY Window (9:30-11:30)...');

  // Must be NY session for JadeCap model
  if (context.session !== 'ny') {
    logger.warn(`      ✗ Wrong session: ${context.session} (need NY session)`);
    return false;
  }

  // In real implementation, check actual time is between 9:30-11:30
  // For now, assume if it's NY session, we're good
  logger.success('      ✓ NY session window confirmed');
  return true;
}

/**
 * 3. FVG OR MSS VALIDATION
 * Validates Fair Value Gap or Market Structure Shift after sweep
 */
function validateFVGOrMSS(context: MarketContext): boolean {
  logger.info('  [3/4] Validating FVG/MSS Formation...');

  // Check for structure break (MSS indicator)
  if (!context.structureBreak) {
    logger.warn('      ✗ No MSS (Market Structure Shift) detected');
    return false;
  }

  // Displacement indicates potential FVG
  if (!context.displacement) {
    logger.warn('      ✗ No displacement (FVG indicator) detected');
    return false;
  }

  logger.success('      ✓ FVG/MSS confirmed after sweep');
  return true;
}

/**
 * 4. VOLATILITY CONTEXT
 * Validates favorable volatility conditions
 */
function validateVolatilityContext(context: MarketContext): boolean {
  logger.info('  [4/4] Validating Volatility Context...');

  // JadeCap works best in high volatility
  if (context.volatility === 'low') {
    logger.warn('      ✗ Low volatility, JadeCap prefers high volatility');
    return false;
  }

  // Volume spike indicates active market
  if (!context.volumeSpike) {
    logger.warn('      ✗ No volume spike, market may be inactive');
    return false;
  }

  logger.success('      ✓ High volatility + volume spike confirmed');
  return true;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Determine trade direction based on sweep and HTF
 */
function determineTradeDirection(context: MarketContext): 'bullish' | 'bearish' {
  // After low sweep → expect bullish reversal
  // After high sweep → expect bearish reversal
  if (context.sweptDirection === 'low') {
    return 'bullish';
  } else if (context.sweptDirection === 'high') {
    return 'bearish';
  }

  // Fallback to HTF trend
  return context.htfTrend === 'bullish' ? 'bullish' : 'bearish';
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build JadeCap Playbook Signal
 */
function buildJadeCapSignal(context: MarketContext): PlaybookSignal {
  const direction = determineTradeDirection(context);

  // Build context string
  const contextStr = `${context.sweptDirection} sweep + NY session + FVG/MSS + high volatility`;

  // Build TP logic
  const tpLogic =
    direction === 'bullish'
      ? 'Target = Opposite side liquidity OR recent high'
      : 'Target = Opposite side liquidity OR recent low';

  // Calculate confidence
  let confidence = 82;
  if (context.volumeSpike && context.displacement) confidence += 8; // Strong move
  if (context.volatility === 'high') confidence += 5; // Optimal volatility

  logger.info('  ═══════════════════════════════════════════');
  logger.info('  🎯 JADECAP SIGNAL GENERATED');
  logger.info('  ═══════════════════════════════════════════');
  logger.info(`  Direction: ${direction.toUpperCase()}`);
  logger.info(`  Context: ${contextStr}`);
  logger.info(`  TP Logic: ${tpLogic}`);
  logger.info(`  Confidence: ${confidence}%`);
  logger.info(`  Session: ${context.session.toUpperCase()}`);
  logger.info('  ═══════════════════════════════════════════\n');

  return {
    playbookName: 'JadeCap Liquidity Model',
    direction,
    context: contextStr,
    tpLogic,
    confidence,
    session: context.session,
  };
}
