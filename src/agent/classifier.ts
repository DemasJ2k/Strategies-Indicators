import { MarketContext, ClassifierOutput, PlaybookSignal } from '@custom-types/context';
import { createLogger } from '@utils/agent_logger';
// Import real playbook check functions
import { checkNBB } from '@playbooks/nbb';
import { checkTori } from '@playbooks/tori';
import { checkFabio } from '@playbooks/fabio';
import { checkJadeCap } from '@playbooks/jadecap';

// Create logger for classifier
const logger = createLogger('Classifier');

/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN CLASSIFIER — THE BRAIN
 * ═══════════════════════════════════════════════════════════════
 * Priority logic:
 *   1. NBB (HTF + PO3 + OTE)
 *   2. JadeCap (Session sweep)
 *   3. Tori (Trendline)
 *   4. Fabio (Balance → Imbalance)
 *
 * NOTE: This classifier now calls REAL playbook functions from @playbooks/*
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

/**
 * ═══════════════════════════════════════════════════════════════
 * NOTE: Playbook check functions (checkNBB, checkTori, checkFabio,
 * checkJadeCap) are now imported from their respective playbook modules.
 *
 * Each playbook module contains:
 * - Full validation logic
 * - Signal building
 * - Confidence scoring
 *
 * See: @playbooks/nbb, @playbooks/tori, @playbooks/fabio, @playbooks/jadecap
 * ═══════════════════════════════════════════════════════════════
 */
