import { buildMarketContext } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { mockScenarioNBB } from './scenarios/nbb';
import { mockScenarioTori } from './scenarios/tori';
import { mockScenarioFabio } from './scenarios/fabio';
import { mockScenarioJadeCap } from './scenarios/jadecap';

/**
 * ═══════════════════════════════════════════════════════════════
 * SCENARIO TEST RUNNER
 * ═══════════════════════════════════════════════════════════════
 * Runs all mock scenarios through the agent pipeline.
 *
 * Usage:
 *   npm run test:scenarios
 *
 * This is NOT a Jest test - it's a standalone runner for rapid iteration.
 */

interface TestResult {
  scenarioName: string;
  playbookSelected: string | null;
  direction: string | null;
  confidence: number | null;
  session: string | null;
  context: string | null;
  tpLogic: string | null;
  priority: number | null;
  passed: boolean;
  expectedPlaybook: string;
}

async function runScenarios() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 SCENARIO TEST RUNNER - STARTING');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results: TestResult[] = [];

  // ─────────────────────────────────────────────────────────────
  // Scenario 1: NBB Playbook
  // ─────────────────────────────────────────────────────────────

  console.log('📊 Scenario 1: NBB Playbook');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Expected: NBB playbook (LONG, 85-95% confidence)\n');

  try {
    const context1 = buildMarketContext(mockScenarioNBB);
    const result1 = classifyMarket(context1);

    const testResult1: TestResult = {
      scenarioName: 'NBB',
      playbookSelected: result1.signal?.playbookName || null,
      direction: result1.signal?.direction || null,
      confidence: result1.signal?.confidence || null,
      session: result1.signal?.session || null,
      context: result1.signal?.context || null,
      tpLogic: result1.signal?.tpLogic || null,
      priority: result1.priority || null,
      passed: result1.signal?.playbookName === 'NBB',
      expectedPlaybook: 'NBB',
    };

    results.push(testResult1);
    displayResult(testResult1);
  } catch (error) {
    console.error('❌ ERROR in NBB scenario:', error);
    results.push({
      scenarioName: 'NBB',
      playbookSelected: null,
      direction: null,
      confidence: null,
      session: null,
      context: null,
      tpLogic: null,
      priority: null,
      passed: false,
      expectedPlaybook: 'NBB',
    });
  }

  console.log('\n');

  // ─────────────────────────────────────────────────────────────
  // Scenario 2: Tori Playbook
  // ─────────────────────────────────────────────────────────────

  console.log('📊 Scenario 2: Tori (Trendline) Playbook');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Expected: Tori playbook (LONG, 80-90% confidence)\n');

  try {
    const context2 = buildMarketContext(mockScenarioTori);
    const result2 = classifyMarket(context2);

    const testResult2: TestResult = {
      scenarioName: 'Tori',
      playbookSelected: result2.signal?.playbookName || null,
      direction: result2.signal?.direction || null,
      confidence: result2.signal?.confidence || null,
      session: result2.signal?.session || null,
      context: result2.signal?.context || null,
      tpLogic: result2.signal?.tpLogic || null,
      priority: result2.priority || null,
      passed: result2.signal?.playbookName === 'Tori (Trendline)',
      expectedPlaybook: 'Tori (Trendline)',
    };

    results.push(testResult2);
    displayResult(testResult2);
  } catch (error) {
    console.error('❌ ERROR in Tori scenario:', error);
    results.push({
      scenarioName: 'Tori',
      playbookSelected: null,
      direction: null,
      confidence: null,
      session: null,
      context: null,
      tpLogic: null,
      priority: null,
      passed: false,
      expectedPlaybook: 'Tori (Trendline)',
    });
  }

  console.log('\n');

  // ─────────────────────────────────────────────────────────────
  // Scenario 3: Fabio Playbook
  // ─────────────────────────────────────────────────────────────

  console.log('📊 Scenario 3: Fabio (Auction Market) Playbook');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Expected: Fabio playbook (LONG, 75-85% confidence)\n');

  try {
    const context3 = buildMarketContext(mockScenarioFabio);
    const result3 = classifyMarket(context3);

    const testResult3: TestResult = {
      scenarioName: 'Fabio',
      playbookSelected: result3.signal?.playbookName || null,
      direction: result3.signal?.direction || null,
      confidence: result3.signal?.confidence || null,
      session: result3.signal?.session || null,
      context: result3.signal?.context || null,
      tpLogic: result3.signal?.tpLogic || null,
      priority: result3.priority || null,
      passed: result3.signal?.playbookName === 'Fabio (Auction Market)',
      expectedPlaybook: 'Fabio (Auction Market)',
    };

    results.push(testResult3);
    displayResult(testResult3);
  } catch (error) {
    console.error('❌ ERROR in Fabio scenario:', error);
    results.push({
      scenarioName: 'Fabio',
      playbookSelected: null,
      direction: null,
      confidence: null,
      session: null,
      context: null,
      tpLogic: null,
      priority: null,
      passed: false,
      expectedPlaybook: 'Fabio (Auction Market)',
    });
  }

  console.log('\n');

  // ─────────────────────────────────────────────────────────────
  // Scenario 4: JadeCap Playbook
  // ─────────────────────────────────────────────────────────────

  console.log('📊 Scenario 4: JadeCap (Liquidity Model) Playbook');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Expected: JadeCap playbook (SHORT, 80-90% confidence)\n');

  try {
    const context4 = buildMarketContext(mockScenarioJadeCap);
    const result4 = classifyMarket(context4);

    const testResult4: TestResult = {
      scenarioName: 'JadeCap',
      playbookSelected: result4.signal?.playbookName || null,
      direction: result4.signal?.direction || null,
      confidence: result4.signal?.confidence || null,
      session: result4.signal?.session || null,
      context: result4.signal?.context || null,
      tpLogic: result4.signal?.tpLogic || null,
      priority: result4.priority || null,
      passed: result4.signal?.playbookName === 'JadeCap (Liquidity Model)',
      expectedPlaybook: 'JadeCap (Liquidity Model)',
    };

    results.push(testResult4);
    displayResult(testResult4);
  } catch (error) {
    console.error('❌ ERROR in JadeCap scenario:', error);
    results.push({
      scenarioName: 'JadeCap',
      playbookSelected: null,
      direction: null,
      confidence: null,
      session: null,
      context: null,
      tpLogic: null,
      priority: null,
      passed: false,
      expectedPlaybook: 'JadeCap (Liquidity Model)',
    });
  }

  console.log('\n');

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────

  displaySummary(results);
}

function displayResult(result: TestResult) {
  if (result.playbookSelected) {
    console.log(`✓ Playbook: ${result.playbookSelected}`);
    console.log(`  Direction: ${result.direction}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Session: ${result.session}`);
    console.log(`  Priority: ${result.priority}`);
    console.log(`\n  Context: ${result.context}`);
    console.log(`\n  TP Logic: ${result.tpLogic}`);

    if (result.passed) {
      console.log(`\n✅ TEST PASSED - Correct playbook selected`);
    } else {
      console.log(
        `\n⚠️  TEST FAILED - Expected ${result.expectedPlaybook}, got ${result.playbookSelected}`
      );
    }
  } else {
    console.log('❌ No playbook selected');
    console.log(`\n⚠️  TEST FAILED - Expected ${result.expectedPlaybook}, got nothing`);
  }
}

function displaySummary(results: TestResult[]) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Scenarios: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('Breakdown:');
  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    const playbook = result.playbookSelected || 'NONE';
    console.log(`  ${status} ${result.scenarioName}: ${playbook} (${result.confidence || 0}%)`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed - review logic above`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════════════════════
// Run all scenarios
// ═══════════════════════════════════════════════════════════════

runScenarios().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
