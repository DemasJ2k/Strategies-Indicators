import { loadCandlesFromCSV } from '@loaders/csvLoader';
import { runSimulation, generateReport } from '@sim/simulator';
import { SimulationConfig } from '@custom-types/simulation';
import { createLogger } from '@utils/agent_logger';
import { loadConfig } from '@config/config';

const logger = createLogger('CSV-Runner');

/**
 * ═══════════════════════════════════════════════════════════════
 * CSV SIMULATION RUNNER
 * ═══════════════════════════════════════════════════════════════
 * Quick test runner for simulating strategies on CSV data.
 *
 * Usage:
 *   npm run sim:csv -- examples/data.csv
 *   npm run sim:csv -- examples/data.csv NBB
 *   npm run sim:csv -- examples/data.csv all
 *
 * Features:
 * - Load historical data from CSV
 * - Run simulation with configured risk parameters
 * - Generate detailed performance report
 * - Fast local testing without infrastructure
 */

/**
 * Run simulation on CSV file
 *
 * @param csvPath - Path to CSV file
 * @param playbookFilter - Filter for specific playbook ('NBB', 'Tori', 'Fabio', 'JadeCap', 'all')
 */
export async function runSimulatorCSV(
  csvPath: string,
  playbookFilter: 'NBB' | 'Tori' | 'Fabio' | 'JadeCap' | 'all' = 'all'
): Promise<void> {
  try {
    logger.info('═══════════════════════════════════════════════════');
    logger.info('🎮 CSV SIMULATION RUNNER');
    logger.info('═══════════════════════════════════════════════════\n');

    // Load config (for consistent settings)
    loadConfig();

    // Load candles from CSV
    logger.info(`📂 Loading data from: ${csvPath}\n`);
    const candles = await loadCandlesFromCSV(csvPath);
    logger.success(`✓ Loaded ${candles.length} candles\n`);

    if (candles.length < 50) {
      logger.warn('⚠️  Warning: Less than 50 candles may not produce reliable results');
    }

    // Calculate previous day high/low (simplified - use all candles)
    const allHighs = candles.map((c) => c.high);
    const allLows = candles.map((c) => c.low);
    const previousDayHigh = Math.max(...allHighs);
    const previousDayLow = Math.min(...allLows);

    logger.info(`Previous Day High: ${previousDayHigh}`);
    logger.info(`Previous Day Low: ${previousDayLow}\n`);

    // Create simulation config
    const config: SimulationConfig = {
      candles,
      previousDayHigh,
      previousDayLow,
      playbookFilter: playbookFilter === 'all' ? undefined : playbookFilter,
      riskConfig: {
        riskPerTradePercent: 2, // Risk 2% per trade
        stopLossPoints: 20, // 20 points stop loss
        takeProfitPoints: 40, // 40 points take profit (2:1 R:R)
        maxPositions: 1, // Only 1 position at a time
        useTrailingStop: false,
      },
      startingCapital: 100000, // $100k starting capital
      verbose: false, // Set to true for detailed trade-by-trade logging
    };

    // Run simulation
    const result = await runSimulation(config);

    // Generate report
    generateReport(result);

    // Summary
    const resultEmoji = result.totalReturnPercent >= 0 ? '✅' : '❌';
    logger.info(`${resultEmoji} Simulation complete: ${result.metrics.totalTrades} trades | ${result.metrics.winRate.toFixed(1)}% win rate | ${result.totalReturnPercent >= 0 ? '+' : ''}${result.totalReturnPercent.toFixed(2)}% return\n`);
  } catch (error) {
    logger.error('❌ Simulation failed:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

async function main() {
  try {
    // Parse command line arguments
    const csvPath = process.argv[2] || './examples/data.csv';
    const playbookFilter = (process.argv[3] || 'all') as 'NBB' | 'Tori' | 'Fabio' | 'JadeCap' | 'all';

    // Validate playbook filter
    const validFilters = ['NBB', 'Tori', 'Fabio', 'JadeCap', 'all'];
    if (!validFilters.includes(playbookFilter)) {
      logger.error(`Invalid playbook filter: ${playbookFilter}`);
      logger.info(`Valid options: ${validFilters.join(', ')}`);
      process.exit(1);
    }

    await runSimulatorCSV(csvPath, playbookFilter);
  } catch (error) {
    logger.error('Fatal error:', error);
    logger.info('\nUsage:');
    logger.info('  npm run sim:csv -- <csv-path> [playbook-filter]');
    logger.info('\nExamples:');
    logger.info('  npm run sim:csv -- examples/data.csv');
    logger.info('  npm run sim:csv -- examples/data.csv NBB');
    logger.info('  npm run sim:csv -- examples/data.csv all\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default {
  runSimulatorCSV,
};
