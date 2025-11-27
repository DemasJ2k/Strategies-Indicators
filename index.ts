import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { createLogger } from '@utils/agent_logger';
import { loadConfig, logConfigSummary } from '@config/config';

const logger = createLogger('Main');

/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN ENTRY POINT
 * ═══════════════════════════════════════════════════════════════
 * Demonstrates the complete flow:
 *   1. Raw Market Data (from your data source)
 *   2. buildMarketContext() → MarketContext (runs all detectors)
 *   3. classifyMarket() → ClassifierOutput (selects playbook)
 *   4. Display results
 */
async function main() {
  try {
    logger.info('═══════════════════════════════════════════════════');
    logger.info('🤖 MARKET PLAYBOOK AGENT - VERSION 1');
    logger.info('═══════════════════════════════════════════════════\n');

    // Load configuration
    loadConfig();
    logConfigSummary();

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Raw Market Data (Mock)
    // ─────────────────────────────────────────────────────────────
    // In production, this would come from your data source (API, database, etc.)

    logger.info('📊 Creating mock market data...\n');

    const rawData: RawMarketData = {
      candles: [
        // Simulating bullish trend with higher highs and higher lows
        { open: 4480, high: 4490, low: 4475, close: 4485, volume: 800000 },
        { open: 4485, high: 4495, low: 4480, close: 4490, volume: 850000 },
        { open: 4490, high: 4500, low: 4485, close: 4495, volume: 900000 },
        { open: 4495, high: 4510, low: 4490, close: 4505, volume: 1200000 }, // Volume spike
        { open: 4505, high: 4520, low: 4500, close: 4515, volume: 1500000 }, // Strong displacement
      ],
      previousDayHigh: 4510.0,
      previousDayLow: 4470.0,
    };

    logger.success('✓ Mock data created\n');

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Build Market Context
    // ─────────────────────────────────────────────────────────────
    // This runs all detectors and builds a complete MarketContext

    const marketContext = buildMarketContext(rawData);

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Run Classifier
    // ─────────────────────────────────────────────────────────────
    // Classifier analyzes context and selects the best playbook

    const result = classifyMarket(marketContext);

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Display Results
    // ─────────────────────────────────────────────────────────────

    logger.info('\n═══════════════════════════════════════════════════');
    logger.info('📋 FINAL RESULTS');
    logger.info('═══════════════════════════════════════════════════\n');

    if (result.signal) {
      logger.success(`✓ Playbook Selected: ${result.signal.playbookName}`);
      logger.info(`  Priority: ${result.priority}`);
      logger.info(`  Direction: ${result.signal.direction.toUpperCase()}`);
      logger.info(`  Session: ${result.signal.session.toUpperCase()}`);
      logger.info(`  Confidence: ${result.signal.confidence}%`);
      logger.info(`\n  Context: ${result.signal.context}`);
      logger.info(`\n  TP Logic: ${result.signal.tpLogic}`);
    } else {
      logger.warn('⚠ No playbook conditions met');
      logger.info('  Market does not match any strategy criteria');
    }

    logger.info('\n═══════════════════════════════════════════════════');
    logger.info('✓ Agent execution completed successfully');
    logger.info('═══════════════════════════════════════════════════\n');
  } catch (error) {
    logger.error('\n❌ Fatal error in agent execution:', error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// Run the agent
// ═══════════════════════════════════════════════════════════════

main();
