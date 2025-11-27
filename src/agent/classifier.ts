import { MarketContext, ClassifierOutput, PlaybookSignal } from '@types/context';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN CLASSIFIER — THE BRAIN
 * ═══════════════════════════════════════════════════════════════
 * Priority logic:
 *   1. NBB (HTF + PO3 + OTE)
 *   2. JadeCap (Session sweep)
 *   3. Tori (Trendline)
 *   4. Fabio (Balance → Imbalance)
 */
export function classifyMarket(market: MarketContext): ClassifierOutput {
  logger.info('═══════════════════════════════════════════');
  logger.info('🧠 CLASSIFIER ANALYZING MARKET CONDITIONS...');
  logger.info('═══════════════════════════════════════════\n');

  // Priority 1: Check NBB
  logger.info('→ Checking NBB Model (Priority 1)...');
  const nbbSignal = checkNBB(market);
  if (nbbSignal) {
    logger.success('✓✓✓ NBB MODEL TRIGGERED ✓✓✓');
    return { signal: nbbSignal, priority: 1, timestamp: new Date() };
  }

  // Priority 2: Check JadeCap
  logger.info('→ Checking JadeCap Model (Priority 2)...');
  const jadecapSignal = checkJadeCap(market);
  if (jadecapSignal) {
    logger.success('✓✓✓ JADECAP MODEL TRIGGERED ✓✓✓');
    return { signal: jadecapSignal, priority: 2, timestamp: new Date() };
  }

  // Priority 3: Check Tori
  logger.info('→ Checking Tori Model (Priority 3)...');
  const toriSignal = checkTori(market);
  if (toriSignal) {
    logger.success('✓✓✓ TORI MODEL TRIGGERED ✓✓✓');
    return { signal: toriSignal, priority: 3, timestamp: new Date() };
  }

  // Priority 4: Check Fabio
  logger.info('→ Checking Fabio Model (Priority 4)...');
  const fabioSignal = checkFabio(market);
  if (fabioSignal) {
    logger.success('✓✓✓ FABIO MODEL TRIGGERED ✓✓✓');
    return { signal: fabioSignal, priority: 4, timestamp: new Date() };
  }

  // No playbook matched
  logger.warn('⚠️ NO PLAYBOOK CONDITIONS MET');
  logger.warn('Market does not match any strategy criteria.\n');
  return { signal: null, priority: 0, timestamp: new Date() };
}

// ═══════════════════════════════════════════════════════════════
// NBB MODEL — THE FULL LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * NBB (PO3 + OTE) Model Checker
 *
 * Triggers:
 *   1. HTF trend (bullish or bearish)
 *   2. Price at PO3 zone (premium for bearish, discount for bullish)
 *   3. Liquidity sweep (opposite direction)
 *   4. Structure break (in trend direction)
 *   5. Volume spike
 *   6. OTE retrace (0.62, 0.705, 0.79 Fib)
 */
function checkNBB(market: MarketContext): PlaybookSignal | null {
  logger.info('  📊 NBB Analysis Starting...\n');

  // ─────────────────────────────────────────────────────────────
  // Step 1: HTF Bias Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [1/6] Checking HTF Bias...');
  if (!hasHTFBias(market)) {
    logger.warn('  ✗ HTF trend is neutral — NBB requires clear bias\n');
    return null;
  }
  logger.success(`  ✓ HTF Bias confirmed: ${market.htfTrend.toUpperCase()}`);

  // ─────────────────────────────────────────────────────────────
  // Step 2: PO3 Zone Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [2/6] Checking PO3 Zone...');
  if (!market.po3ZonePresent || !market.priceAtPO3) {
    logger.warn('  ✗ Price not at PO3 zone\n');
    return null;
  }
  logger.success('  ✓ Price is at PO3 zone');

  // ─────────────────────────────────────────────────────────────
  // Step 3: Liquidity Sweep Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [3/6] Checking Liquidity Sweep...');
  if (!hasLiquiditySweep(market)) {
    logger.warn('  ✗ No liquidity sweep detected\n');
    return null;
  }
  logger.success(`  ✓ Liquidity sweep confirmed: ${market.sweptDirection} side`);

  // ─────────────────────────────────────────────────────────────
  // Step 4: Structure Break Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [4/6] Checking Structure Break...');
  if (!hasStructureBreak(market)) {
    logger.warn('  ✗ No structure break detected\n');
    return null;
  }
  logger.success(`  ✓ Structure break confirmed: ${market.breakDirection}`);

  // ─────────────────────────────────────────────────────────────
  // Step 5: Volume Spike Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [5/6] Checking Volume...');
  if (!hasVolumeSpike(market)) {
    logger.warn('  ✗ No volume spike detected\n');
    return null;
  }
  logger.success('  ✓ Volume spike + displacement confirmed');

  // ─────────────────────────────────────────────────────────────
  // Step 6: OTE Retrace Check
  // ─────────────────────────────────────────────────────────────
  logger.info('  [6/6] Checking OTE Retrace...');
  if (!hasOTERetrace(market)) {
    logger.warn('  ✗ No OTE retrace detected\n');
    return null;
  }
  logger.success(`  ✓ OTE retrace confirmed at level: ${market.oteLevel}`);

  // ─────────────────────────────────────────────────────────────
  // ALL CONDITIONS MET → BUILD SIGNAL
  // ─────────────────────────────────────────────────────────────
  logger.info('\n  🎯 ALL NBB CONDITIONS SATISFIED!\n');

  // Determine direction based on HTF trend
  const direction: 'bullish' | 'bearish' = market.htfTrend === 'bullish' ? 'bullish' : 'bearish';

  // Build context string
  const context =
    direction === 'bullish'
      ? `HTF bullish + swept ${market.sweptDirection} + PO3 discount + OTE ${market.oteLevel} + structure break up`
      : `HTF bearish + swept ${market.sweptDirection} + PO3 premium + OTE ${market.oteLevel} + structure break down`;

  // Build TP logic
  const tpLogic =
    direction === 'bullish'
      ? 'Target = Previous Day High OR next MSS'
      : 'Target = Previous Day Low OR next MSS';

  // Calculate confidence (can be refined later)
  const confidence = 85;

  return {
    playbookName: 'NBB PO3/OTE',
    direction,
    context,
    tpLogic,
    confidence,
    session: market.session,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — NBB VALIDATION
// ═══════════════════════════════════════════════════════════════

function hasHTFBias(market: MarketContext): boolean {
  return market.htfTrend === 'bullish' || market.htfTrend === 'bearish';
}

function hasLiquiditySweep(market: MarketContext): boolean {
  if (!market.liquiditySweep || !market.sweptDirection) {
    return false;
  }

  // For bullish: should sweep low
  // For bearish: should sweep high
  if (market.htfTrend === 'bullish' && market.sweptDirection !== 'low') {
    return false;
  }
  if (market.htfTrend === 'bearish' && market.sweptDirection !== 'high') {
    return false;
  }

  return true;
}

function hasStructureBreak(market: MarketContext): boolean {
  if (!market.structureBreak || !market.breakDirection) {
    return false;
  }

  // Structure break should align with HTF trend
  if (market.htfTrend === 'bullish' && market.breakDirection !== 'bullish') {
    return false;
  }
  if (market.htfTrend === 'bearish' && market.breakDirection !== 'bearish') {
    return false;
  }

  return true;
}

function hasVolumeSpike(market: MarketContext): boolean {
  return market.volumeSpike && market.displacement;
}

function hasOTERetrace(market: MarketContext): boolean {
  return market.oteRetrace && market.oteLevel !== null;
}

// ═══════════════════════════════════════════════════════════════
// OTHER PLAYBOOKS (PLACEHOLDERS)
// ═══════════════════════════════════════════════════════════════

function checkJadeCap(market: MarketContext): PlaybookSignal | null {
  // TODO: Implement JadeCap logic later
  logger.info('  JadeCap not implemented yet\n');
  return null;
}

function checkTori(market: MarketContext): PlaybookSignal | null {
  // TODO: Implement Tori logic later
  logger.info('  Tori not implemented yet\n');
  return null;
}

function checkFabio(market: MarketContext): PlaybookSignal | null {
  // TODO: Implement Fabio logic later
  logger.info('  Fabio not implemented yet\n');
  return null;
}
