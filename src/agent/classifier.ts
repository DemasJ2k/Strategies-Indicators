import { MarketContext, ClassifierOutput, PlaybookSignal } from '@custom-types/context';
import { createLogger } from '@utils/agent_logger';
import { getAllPlaybookConfigs } from '@config/config';
// Import real playbook check functions
import { checkNBB } from '@playbooks/nbb';
import { checkTori } from '@playbooks/tori';
import { checkFabio } from '@playbooks/fabio';
import { checkJadeCap } from '@playbooks/jadecap';

// Create logger for classifier
const logger = createLogger('Classifier');

// Playbook check function mapping
const playbookCheckers: Record<string, (context: MarketContext) => PlaybookSignal | null> = {
  NBB: checkNBB,
  Tori: checkTori,
  Fabio: checkFabio,
  JadeCap: checkJadeCap,
};

/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN CLASSIFIER — THE BRAIN
 * ═══════════════════════════════════════════════════════════════
 * Dynamic priority logic based on config/playbooks.json
 * - Playbooks checked in order of priority (lowest number = highest priority)
 * - Only enabled playbooks are checked
 * - Returns first playbook that matches all conditions
 *
 * NOTE: This classifier now calls REAL playbook functions from @playbooks/*
 * and uses config-driven priority ordering
 */
export function classifyMarket(market: MarketContext): ClassifierOutput {
  logger.info('═══════════════════════════════════════════');
  logger.info('🧠 CLASSIFIER ANALYZING MARKET CONDITIONS...');
  logger.info('═══════════════════════════════════════════\n');

  // Get playbooks sorted by priority from config
  const playbooks = getAllPlaybookConfigs();

  // Check each playbook in priority order
  for (const { name, config } of playbooks) {
    // Skip disabled playbooks
    if (!config.enabled) {
      logger.info(`→ Skipping ${name} (disabled in config)`);
      continue;
    }

    logger.info(`→ Checking ${name} Model (Priority ${config.priority})...`);

    // Get the check function for this playbook
    const checkFunction = playbookCheckers[name];
    if (!checkFunction) {
      logger.warn(`⚠️  No check function found for playbook: ${name}`);
      continue;
    }

    // Execute playbook check
    const signal = checkFunction(market);

    // If playbook matched, return immediately
    if (signal) {
      logger.success(`✓✓✓ ${name.toUpperCase()} MODEL TRIGGERED ✓✓✓`);
      return { signal, priority: config.priority, timestamp: new Date() };
    }
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
