import { createLogger } from '@utils/agent_logger';
import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import {
  SimulationConfig,
  SimulationResult,
  Trade,
  BacktestMetrics,
  PerformanceStats,
  PlaybookBreakdown,
  EquityCurvePoint,
} from '@custom-types/simulation';

const logger = createLogger('Simulator');

/**
 * ═══════════════════════════════════════════════════════════════
 * SIMULATION ENGINE
 * ═══════════════════════════════════════════════════════════════
 * Dry-run backtesting engine for testing playbooks on historical data.
 *
 * Features:
 * - Run simulations on CSV/historical data
 * - Track trades and P&L
 * - Calculate performance metrics
 * - Support multiple playbooks
 * - Risk management
 *
 * Usage:
 * ```typescript
 * const config: SimulationConfig = {
 *   candles: historicalData,
 *   previousDayHigh: 4600,
 *   previousDayLow: 4400,
 *   playbookFilter: 'NBB',
 *   riskConfig: {
 *     riskPerTradePercent: 2,
 *     stopLossPoints: 20,
 *     takeProfitPoints: 40,
 *     maxPositions: 1,
 *   },
 *   startingCapital: 100000,
 * };
 *
 * const result = await runSimulation(config);
 * generateReport(result);
 * ```
 */

// ═══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run simulation on historical data
 *
 * @param config - Simulation configuration
 * @returns Simulation results with trades and metrics
 */
export async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
  const startTime = new Date();
  logger.info('═══════════════════════════════════════════');
  logger.info('🎮 STARTING SIMULATION');
  logger.info('═══════════════════════════════════════════');
  logger.info(`Candles: ${config.candles.length}`);
  logger.info(`Playbook Filter: ${config.playbookFilter || 'all'}`);
  logger.info(`Starting Capital: $${config.startingCapital.toLocaleString()}`);
  logger.info(`Risk per Trade: ${config.riskConfig.riskPerTradePercent}%`);
  logger.info('═══════════════════════════════════════════\n');

  const trades: Trade[] = [];
  let openTrades: Trade[] = [];
  let currentCapital = config.startingCapital;
  let tradeIdCounter = 1;
  let peakCapital = currentCapital;
  let maxDrawdown = 0;

  // Simulate candle by candle
  for (let i = 0; i < config.candles.length; i++) {
    const currentIndex = i;
    const currentCandle = config.candles[i];

    if (config.verbose && i % 100 === 0) {
      logger.info(`Processing candle ${i + 1}/${config.candles.length} (${((i / config.candles.length) * 100).toFixed(1)}%)`);
    }

    // Check open trades for exits (stop loss, take profit)
    for (const trade of openTrades) {
      const exitResult = checkTradeExit(trade, currentCandle, currentIndex);
      if (exitResult.shouldExit) {
        // Close trade
        trade.exitTime = currentCandle.time;
        trade.exitPrice = exitResult.exitPrice!;
        trade.exitReason = exitResult.exitReason!;

        // Calculate P&L
        const direction = trade.direction === 'bullish' ? 1 : -1;
        trade.profitLossPoints = direction * (trade.exitPrice! - trade.entryPrice);
        trade.profitLossCurrency = trade.profitLossPoints * trade.size;

        // Update capital
        currentCapital += trade.profitLossCurrency;

        // Track drawdown
        if (currentCapital > peakCapital) {
          peakCapital = currentCapital;
        }
        const currentDrawdown = peakCapital - currentCapital;
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
        }

        trades.push(trade);

        if (config.verbose) {
          const profitEmoji = trade.profitLossCurrency! >= 0 ? '✅' : '❌';
          logger.info(`${profitEmoji} Trade #${trade.id} closed: ${trade.playbook} | P&L: $${trade.profitLossCurrency?.toFixed(2)} | Reason: ${trade.exitReason}`);
        }
      }
    }

    // Remove closed trades from open trades
    openTrades = openTrades.filter((t) => !t.exitTime);

    // Check if we can open new trades
    if (openTrades.length >= config.riskConfig.maxPositions) {
      continue; // Max positions reached
    }

    // Build market context for current candle window
    // Use last 50 candles (or less if not enough data)
    const lookback = 50;
    const startIdx = Math.max(0, i - lookback + 1);
    const candleWindow = config.candles.slice(startIdx, i + 1);

    if (candleWindow.length < 5) {
      continue; // Not enough data yet
    }

    // Build context
    const rawData: RawMarketData = {
      candles: candleWindow.map((c) => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
        time: c.time,
      })),
      previousDayHigh: config.previousDayHigh,
      previousDayLow: config.previousDayLow,
    };

    const marketContext = buildMarketContext(rawData);

    // Run classifier
    const result = classifyMarket(marketContext);

    // Check if a playbook matched
    if (result.signal) {
      // Apply playbook filter
      if (config.playbookFilter && config.playbookFilter !== 'all') {
        if (!result.signal.playbookName.includes(config.playbookFilter)) {
          continue; // Not the playbook we're filtering for
        }
      }

      // Calculate position size based on risk
      const riskAmount = currentCapital * (config.riskConfig.riskPerTradePercent / 100);
      const stopLossDistance = config.riskConfig.stopLossPoints;
      const positionSize = Math.floor(riskAmount / stopLossDistance);

      if (positionSize <= 0) {
        continue; // Not enough capital to risk
      }

      // Create trade
      const entryPrice = currentCandle.close;
      const direction = result.signal.direction;

      const stopLoss =
        direction === 'bullish'
          ? entryPrice - config.riskConfig.stopLossPoints
          : entryPrice + config.riskConfig.stopLossPoints;

      const takeProfit = config.riskConfig.takeProfitPoints
        ? direction === 'bullish'
          ? entryPrice + config.riskConfig.takeProfitPoints
          : entryPrice - config.riskConfig.takeProfitPoints
        : direction === 'bullish'
          ? config.previousDayHigh
          : config.previousDayLow;

      const trade: Trade = {
        id: tradeIdCounter++,
        entryTime: currentCandle.time,
        entryPrice,
        direction,
        playbook: result.signal.playbookName,
        size: positionSize,
        stopLoss,
        takeProfit,
        signal: result.signal,
      };

      openTrades.push(trade);

      if (config.verbose) {
        logger.info(`📈 Trade #${trade.id} opened: ${trade.playbook} | ${trade.direction.toUpperCase()} @ $${trade.entryPrice} | SL: $${trade.stopLoss.toFixed(2)} | TP: $${trade.takeProfit.toFixed(2)}`);
      }
    }
  }

  // Close any remaining open trades at end of data
  for (const trade of openTrades) {
    const lastCandle = config.candles[config.candles.length - 1];
    trade.exitTime = lastCandle.time;
    trade.exitPrice = lastCandle.close;
    trade.exitReason = 'END_OF_DATA';

    const direction = trade.direction === 'bullish' ? 1 : -1;
    trade.profitLossPoints = direction * (trade.exitPrice - trade.entryPrice);
    trade.profitLossCurrency = trade.profitLossPoints * trade.size;

    currentCapital += trade.profitLossCurrency;
    trades.push(trade);
  }

  // Calculate metrics
  const metrics = calculateMetrics(trades, config.startingCapital, maxDrawdown);
  const stats = calculateStats(trades, config.startingCapital, metrics);
  const playbookBreakdown = calculatePlaybookBreakdown(trades);

  const endTime = new Date();
  const totalReturnPercent = ((currentCapital - config.startingCapital) / config.startingCapital) * 100;

  const result: SimulationResult = {
    config,
    trades,
    metrics,
    stats,
    playbookBreakdown,
    finalCapital: currentCapital,
    totalReturnPercent,
    simulationStartTime: startTime,
    simulationEndTime: endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
  };

  logger.info('\n═══════════════════════════════════════════');
  logger.success('✅ SIMULATION COMPLETE');
  logger.info('═══════════════════════════════════════════');
  logger.info(`Total Trades: ${trades.length}`);
  logger.info(`Win Rate: ${metrics.winRate.toFixed(2)}%`);
  logger.info(`Net P&L: $${metrics.netProfitLoss.toFixed(2)}`);
  logger.info(`Total Return: ${totalReturnPercent.toFixed(2)}%`);
  logger.info(`Max Drawdown: $${metrics.maxDrawdown.toFixed(2)} (${metrics.maxDrawdownPercent.toFixed(2)}%)`);
  logger.info('═══════════════════════════════════════════\n');

  return result;
}

/**
 * Check if a trade should exit
 */
function checkTradeExit(
  trade: Trade,
  currentCandle: any,
  currentIndex: number
): {
  shouldExit: boolean;
  exitPrice?: number;
  exitReason?: 'TP_HIT' | 'SL_HIT' | 'TRAILING_STOP';
} {
  const high = currentCandle.high;
  const low = currentCandle.low;

  if (trade.direction === 'bullish') {
    // Check stop loss
    if (low <= trade.stopLoss) {
      return { shouldExit: true, exitPrice: trade.stopLoss, exitReason: 'SL_HIT' };
    }
    // Check take profit
    if (high >= trade.takeProfit) {
      return { shouldExit: true, exitPrice: trade.takeProfit, exitReason: 'TP_HIT' };
    }
  } else {
    // Bearish trade
    // Check stop loss
    if (high >= trade.stopLoss) {
      return { shouldExit: true, exitPrice: trade.stopLoss, exitReason: 'SL_HIT' };
    }
    // Check take profit
    if (low <= trade.takeProfit) {
      return { shouldExit: true, exitPrice: trade.takeProfit, exitReason: 'TP_HIT' };
    }
  }

  return { shouldExit: false };
}

/**
 * Calculate backtest metrics
 */
function calculateMetrics(
  trades: Trade[],
  startingCapital: number,
  maxDrawdown: number
): BacktestMetrics {
  const closedTrades = trades.filter((t) => t.exitTime);
  const winningTrades = closedTrades.filter((t) => t.profitLossCurrency! > 0);
  const losingTrades = closedTrades.filter((t) => t.profitLossCurrency! <= 0);

  const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLossCurrency!, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLossCurrency!, 0));
  const netProfitLoss = totalProfit - totalLoss;

  const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const maxDrawdownPercent = (maxDrawdown / startingCapital) * 100;

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.profitLossCurrency!)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.profitLossCurrency!)) : 0;

  // Calculate average trade duration (in candles)
  const avgTradeDuration =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => sum + (t.exitTime! - t.entryTime), 0) / closedTrades.length
      : 0;

  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const trade of closedTrades) {
    if (trade.profitLossCurrency! > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
    }
  }

  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalProfit,
    totalLoss,
    netProfitLoss,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent,
    largestWin,
    largestLoss,
    avgTradeDuration,
    maxConsecutiveWins,
    maxConsecutiveLosses,
  };
}

/**
 * Calculate performance statistics
 */
function calculateStats(
  trades: Trade[],
  startingCapital: number,
  metrics: BacktestMetrics
): PerformanceStats {
  const winRate = metrics.winRate / 100;
  const avgWin = metrics.avgWin;
  const avgLoss = metrics.avgLoss;

  // Expectancy per trade
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  // Kelly criterion (optimal bet size percentage)
  const kellyCriterion = avgLoss > 0 ? (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin : 0;

  // ROI
  const roi = (metrics.netProfitLoss / startingCapital) * 100;

  // Total return
  const totalReturn = roi;

  // Recovery factor
  const recoveryFactor = metrics.maxDrawdown > 0 ? metrics.netProfitLoss / metrics.maxDrawdown : 0;

  // Average risk-reward ratio
  const avgRiskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  return {
    expectancy,
    kellyCriterion,
    roi,
    totalReturn,
    maxConsecutiveDrawdown: metrics.maxDrawdownPercent,
    recoveryFactor,
    avgRiskRewardRatio,
  };
}

/**
 * Calculate breakdown by playbook
 */
function calculatePlaybookBreakdown(trades: Trade[]): PlaybookBreakdown[] {
  const playbookMap = new Map<string, Trade[]>();

  for (const trade of trades) {
    if (!playbookMap.has(trade.playbook)) {
      playbookMap.set(trade.playbook, []);
    }
    playbookMap.get(trade.playbook)!.push(trade);
  }

  const breakdown: PlaybookBreakdown[] = [];

  for (const [playbook, pbTrades] of playbookMap.entries()) {
    const winningTrades = pbTrades.filter((t) => t.profitLossCurrency! > 0);
    const losingTrades = pbTrades.filter((t) => t.profitLossCurrency! <= 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLossCurrency!, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLossCurrency!, 0));

    const winRate = pbTrades.length > 0 ? (winningTrades.length / pbTrades.length) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    breakdown.push({
      playbook,
      tradesCount: pbTrades.length,
      winRate,
      netProfitLoss: totalProfit - totalLoss,
      profitFactor,
      avgWin,
      avgLoss,
    });
  }

  return breakdown.sort((a, b) => b.netProfitLoss - a.netProfitLoss);
}

// ═══════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate and print simulation report
 */
export function generateReport(result: SimulationResult): void {
  logger.info('\n\n');
  logger.info('════════════════════════════════════════════════════════════');
  logger.info('📊 SIMULATION REPORT');
  logger.info('════════════════════════════════════════════════════════════\n');

  // Configuration
  logger.info('⚙️  CONFIGURATION:');
  logger.info(`   Starting Capital: $${result.config.startingCapital.toLocaleString()}`);
  logger.info(`   Risk per Trade: ${result.config.riskConfig.riskPerTradePercent}%`);
  logger.info(`   Stop Loss: ${result.config.riskConfig.stopLossPoints} points`);
  logger.info(`   Take Profit: ${result.config.riskConfig.takeProfitPoints || 'Dynamic'} points`);
  logger.info(`   Playbook Filter: ${result.config.playbookFilter || 'All'}`);
  logger.info(`   Data Points: ${result.config.candles.length} candles\n`);

  // Overall Performance
  logger.info('📈 OVERALL PERFORMANCE:');
  logger.info(`   Final Capital: $${result.finalCapital.toLocaleString()}`);
  logger.info(`   Total Return: ${result.totalReturnPercent >= 0 ? '+' : ''}${result.totalReturnPercent.toFixed(2)}%`);
  logger.info(`   Net P&L: $${result.metrics.netProfitLoss.toFixed(2)}`);
  logger.info(`   ROI: ${result.stats.roi.toFixed(2)}%\n`);

  // Trade Statistics
  logger.info('📊 TRADE STATISTICS:');
  logger.info(`   Total Trades: ${result.metrics.totalTrades}`);
  logger.info(`   Winning Trades: ${result.metrics.winningTrades} (${result.metrics.winRate.toFixed(2)}%)`);
  logger.info(`   Losing Trades: ${result.metrics.losingTrades}`);
  logger.info(`   Profit Factor: ${result.metrics.profitFactor.toFixed(2)}`);
  logger.info(`   Expectancy: $${result.stats.expectancy.toFixed(2)} per trade\n`);

  // Win/Loss Analysis
  logger.info('💰 WIN/LOSS ANALYSIS:');
  logger.info(`   Total Profit: $${result.metrics.totalProfit.toFixed(2)}`);
  logger.info(`   Total Loss: $${result.metrics.totalLoss.toFixed(2)}`);
  logger.info(`   Average Win: $${result.metrics.avgWin.toFixed(2)}`);
  logger.info(`   Average Loss: $${result.metrics.avgLoss.toFixed(2)}`);
  logger.info(`   Avg Risk/Reward: ${result.stats.avgRiskRewardRatio.toFixed(2)}:1`);
  logger.info(`   Largest Win: $${result.metrics.largestWin.toFixed(2)}`);
  logger.info(`   Largest Loss: $${result.metrics.largestLoss.toFixed(2)}\n`);

  // Risk Metrics
  logger.info('⚠️  RISK METRICS:');
  logger.info(`   Max Drawdown: $${result.metrics.maxDrawdown.toFixed(2)} (${result.metrics.maxDrawdownPercent.toFixed(2)}%)`);
  logger.info(`   Recovery Factor: ${result.stats.recoveryFactor.toFixed(2)}`);
  logger.info(`   Max Consecutive Wins: ${result.metrics.maxConsecutiveWins}`);
  logger.info(`   Max Consecutive Losses: ${result.metrics.maxConsecutiveLosses}\n`);

  // Playbook Breakdown
  if (result.playbookBreakdown.length > 0) {
    logger.info('📋 PLAYBOOK BREAKDOWN:');
    for (const pb of result.playbookBreakdown) {
      logger.info(`\n   ${pb.playbook}:`);
      logger.info(`      Trades: ${pb.tradesCount}`);
      logger.info(`      Win Rate: ${pb.winRate.toFixed(2)}%`);
      logger.info(`      Net P&L: $${pb.netProfitLoss.toFixed(2)}`);
      logger.info(`      Profit Factor: ${pb.profitFactor.toFixed(2)}`);
      logger.info(`      Avg Win: $${pb.avgWin.toFixed(2)} | Avg Loss: $${pb.avgLoss.toFixed(2)}`);
    }
    logger.info('');
  }

  // Execution Time
  logger.info(`⏱️  Execution Time: ${result.durationMs}ms`);

  logger.info('\n════════════════════════════════════════════════════════════\n\n');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  runSimulation,
  generateReport,
};
