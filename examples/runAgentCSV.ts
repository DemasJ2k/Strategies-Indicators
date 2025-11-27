import { loadCandlesFromCSV } from '../src/loaders/csvLoader';
import { buildMarketContext, RawMarketData } from '../src/agent/context';
import { classifyMarket } from '../src/agent/classifier';
import { Candle } from '../src/types/candle';

/**
 * ═══════════════════════════════════════════════════════════════
 * EXAMPLE: RUN AGENT ON CSV FILE
 * ═══════════════════════════════════════════════════════════════
 * Demonstrates how to:
 * 1. Load candles from a CSV file
 * 2. Convert to RawMarketData format
 * 3. Build MarketContext using all detectors
 * 4. Run classifier to get playbook signal
 * 5. Display trade plan
 *
 * Usage:
 *   npm run dev -- examples/runAgentCSV.ts
 *   OR
 *   ts-node -r tsconfig-paths/register examples/runAgentCSV.ts
 */

/**
 * Run agent on CSV file
 *
 * @param filePath - Path to CSV file (relative or absolute)
 * @returns Classification result with playbook signal
 */
export async function runAgentOnCSV(filePath: string) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🤖 RUNNING MARKET PLAYBOOK AGENT ON CSV DATA');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📂 Loading candles from: ${filePath}\n`);

  // Step 1: Load candles from CSV
  const candles: Candle[] = await loadCandlesFromCSV(filePath);

  console.log(`✓ Loaded ${candles.length} candles`);
  console.log(`  First candle: ${new Date(candles[0].time).toISOString()}`);
  console.log(`  Last candle:  ${new Date(candles[candles.length - 1].time).toISOString()}\n`);

  // Step 2: Calculate previous day high/low (simplified - use last 24 candles if 5m data)
  // For production, you'd determine this based on actual session breaks
  const recentCandles = candles.slice(-50); // Last 50 candles
  const previousDayHigh = Math.max(...recentCandles.map((c) => c.high));
  const previousDayLow = Math.min(...recentCandles.map((c) => c.low));

  console.log(`📊 Previous Day Levels:`);
  console.log(`  High: ${previousDayHigh}`);
  console.log(`  Low:  ${previousDayLow}\n`);

  // Step 3: Convert to RawMarketData format
  const rawData: RawMarketData = {
    candles: candles.map((c) => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume || 0,
      time: c.time,
    })),
    previousDayHigh,
    previousDayLow,
  };

  // Step 4: Build market context (runs all detectors)
  console.log('🔧 Building market context...\n');
  const marketContext = buildMarketContext(rawData);

  // Step 5: Run classifier
  console.log('\n🧠 Running classifier...\n');
  const result = classifyMarket(marketContext);

  // Step 6: Display results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 TRADE PLAN RESULT');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (result.signal) {
    console.log(`✅ PLAYBOOK SELECTED: ${result.signal.playbookName}`);
    console.log(`   Priority: ${result.priority}`);
    console.log(`   Direction: ${result.signal.direction.toUpperCase()}`);
    console.log(`   Session: ${result.signal.session.toUpperCase()}`);
    console.log(`   Confidence: ${result.signal.confidence}%`);
    console.log(`\n   📝 Context:`);
    console.log(`   ${result.signal.context}`);
    console.log(`\n   🎯 TP Logic:`);
    console.log(`   ${result.signal.tpLogic}`);
  } else {
    console.log('⚠️  NO PLAYBOOK SELECTED');
    console.log('   Market does not match any strategy criteria.');
    console.log('   Wait for better conditions.');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  return result;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

/**
 * Run with command line argument or use default file
 */
async function main() {
  try {
    // Get file path from command line args or use default
    const filePath = process.argv[2] || './examples/data.csv';

    await runAgentOnCSV(filePath);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('\nUsage: ts-node -r tsconfig-paths/register examples/runAgentCSV.ts [csv-file-path]\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
