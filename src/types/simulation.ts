import { Candle } from './candle';
import { PlaybookSignal } from './context';

/**
 * ═══════════════════════════════════════════════════════════════
 * SIMULATION & BACKTEST TYPES
 * ═══════════════════════════════════════════════════════════════
 * Type definitions for the simulation/backtesting engine.
 *
 * Supports:
 * - Dry-run simulations on historical data
 * - Performance metrics calculation
 * - Risk management configuration
 * - Trade tracking and P&L calculation
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface SimulationConfig {
  /** Historical candle data to simulate on */
  candles: Candle[];

  /** Previous day high for context */
  previousDayHigh: number;

  /** Previous day low for context */
  previousDayLow: number;

  /** Playbook filter - run specific playbook(s) or 'all' */
  playbookFilter?: 'NBB' | 'Tori' | 'Fabio' | 'JadeCap' | 'all';

  /** Risk configuration */
  riskConfig: RiskConfig;

  /** Starting capital */
  startingCapital: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

export interface RiskConfig {
  /** Risk per trade as percentage of capital (e.g., 2 = 2%) */
  riskPerTradePercent: number;

  /** Stop loss distance in points */
  stopLossPoints: number;

  /** Take profit distance in points (if using fixed TP) */
  takeProfitPoints?: number;

  /** Max number of concurrent positions */
  maxPositions: number;

  /** Enable trailing stop */
  useTrailingStop?: boolean;

  /** Trailing stop distance in points */
  trailingStopPoints?: number;
}

// ═══════════════════════════════════════════════════════════════
// TRADE TRACKING
// ═══════════════════════════════════════════════════════════════

export interface Trade {
  /** Trade ID */
  id: number;

  /** Entry timestamp */
  entryTime: number;

  /** Entry price */
  entryPrice: number;

  /** Direction (long/short) */
  direction: 'bullish' | 'bearish';

  /** Playbook that triggered the trade */
  playbook: string;

  /** Position size (contracts/shares) */
  size: number;

  /** Stop loss price */
  stopLoss: number;

  /** Take profit price */
  takeProfit: number;

  /** Exit timestamp (if closed) */
  exitTime?: number;

  /** Exit price (if closed) */
  exitPrice?: number;

  /** Exit reason */
  exitReason?: 'TP_HIT' | 'SL_HIT' | 'TRAILING_STOP' | 'END_OF_DATA';

  /** Profit/Loss in points */
  profitLossPoints?: number;

  /** Profit/Loss in currency */
  profitLossCurrency?: number;

  /** Trade signal context */
  signal: PlaybookSignal;
}

export type TradeStatus = 'open' | 'closed';

// ═══════════════════════════════════════════════════════════════
// RESULTS & METRICS
// ═══════════════════════════════════════════════════════════════

export interface SimulationResult {
  /** Configuration used */
  config: SimulationConfig;

  /** All executed trades */
  trades: Trade[];

  /** Performance metrics */
  metrics: BacktestMetrics;

  /** Performance statistics */
  stats: PerformanceStats;

  /** Summary by playbook */
  playbookBreakdown: PlaybookBreakdown[];

  /** Final capital */
  finalCapital: number;

  /** Total return percentage */
  totalReturnPercent: number;

  /** Simulation start time */
  simulationStartTime: Date;

  /** Simulation end time */
  simulationEndTime: Date;

  /** Duration in milliseconds */
  durationMs: number;
}

export interface BacktestMetrics {
  /** Total number of trades */
  totalTrades: number;

  /** Number of winning trades */
  winningTrades: number;

  /** Number of losing trades */
  losingTrades: number;

  /** Win rate percentage */
  winRate: number;

  /** Total profit in currency */
  totalProfit: number;

  /** Total loss in currency */
  totalLoss: number;

  /** Net profit/loss */
  netProfitLoss: number;

  /** Average profit per winning trade */
  avgWin: number;

  /** Average loss per losing trade */
  avgLoss: number;

  /** Profit factor (total profit / total loss) */
  profitFactor: number;

  /** Maximum drawdown in currency */
  maxDrawdown: number;

  /** Maximum drawdown percentage */
  maxDrawdownPercent: number;

  /** Sharpe ratio (risk-adjusted return) */
  sharpeRatio?: number;

  /** Largest winning trade */
  largestWin: number;

  /** Largest losing trade */
  largestLoss: number;

  /** Average trade duration in candles */
  avgTradeDuration: number;

  /** Maximum consecutive wins */
  maxConsecutiveWins: number;

  /** Maximum consecutive losses */
  maxConsecutiveLosses: number;
}

export interface PerformanceStats {
  /** Expectancy per trade */
  expectancy: number;

  /** Kelly criterion percentage */
  kellyCriterion: number;

  /** Return on investment percentage */
  roi: number;

  /** Total return percentage */
  totalReturn: number;

  /** Annualized return (if duration >= 1 year) */
  annualizedReturn?: number;

  /** Maximum consecutive drawdown */
  maxConsecutiveDrawdown: number;

  /** Recovery factor (net profit / max drawdown) */
  recoveryFactor: number;

  /** Average risk-reward ratio */
  avgRiskRewardRatio: number;
}

export interface PlaybookBreakdown {
  /** Playbook name */
  playbook: string;

  /** Number of trades for this playbook */
  tradesCount: number;

  /** Win rate for this playbook */
  winRate: number;

  /** Net P&L for this playbook */
  netProfitLoss: number;

  /** Profit factor */
  profitFactor: number;

  /** Average win */
  avgWin: number;

  /** Average loss */
  avgLoss: number;
}

// ═══════════════════════════════════════════════════════════════
// EQUITY CURVE
// ═══════════════════════════════════════════════════════════════

export interface EquityCurvePoint {
  /** Candle index */
  index: number;

  /** Timestamp */
  time: number;

  /** Equity value at this point */
  equity: number;

  /** Drawdown from peak */
  drawdown: number;

  /** Drawdown percentage */
  drawdownPercent: number;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION PROGRESS
// ═══════════════════════════════════════════════════════════════

export interface SimulationProgress {
  /** Current candle index */
  currentIndex: number;

  /** Total candles */
  totalCandles: number;

  /** Progress percentage */
  progressPercent: number;

  /** Open trades count */
  openTrades: number;

  /** Closed trades count */
  closedTrades: number;

  /** Current equity */
  currentEquity: number;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  // Types are exported at module level
};
