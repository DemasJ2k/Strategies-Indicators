import { MarketContext, ClassifierOutput, HTFTrend } from '@custom-types/context';
import { createLogger } from '@utils/agent_logger';

const logger = createLogger('SignalEngine');

/**
 * ═══════════════════════════════════════════════════════════════
 * FLOWREX SIGNAL ENGINE
 * ═══════════════════════════════════════════════════════════════
 * Normalizes all analysis outputs into a unified FlowrexSignal format.
 *
 * Every analysis (manual, MT5, TradingView, replay) produces this signal.
 */

export type SignalDirection = 'long' | 'short' | 'neutral';
export type SignalGrade = 'A' | 'B' | 'C';

export interface FlowrexSignal {
  // Core signal properties
  direction: SignalDirection;
  confidence: number; // 0–100
  grade: SignalGrade; // A = high quality, B = medium, C = low

  // Context
  timeframe: string;
  instrument: string;
  symbol?: string;

  // Playbook info
  playbook: string; // Primary playbook (e.g., "NBB", "Tori")
  primaryPlaybook: string;
  backupPlaybook?: string;

  // Signal reasoning
  reasons: string[]; // Short bullet list of why this signal was generated
  riskHints: string[]; // Warnings/cautions (ADR stretched, late session, etc.)

  // Metadata
  createdAt: string;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * BUILD SIGNAL
 * ═══════════════════════════════════════════════════════════════
 * Convert MarketContext + Classification into normalized FlowrexSignal
 *
 * @param ctx - Market context from detectors
 * @param classification - Playbook classification result
 * @param metadata - Additional metadata (instrument, timeframe, symbol)
 * @returns Normalized FlowrexSignal
 */
export function buildSignal(
  ctx: MarketContext,
  classification: ClassifierOutput,
  metadata: {
    instrument: string;
    timeframe: string;
    symbol?: string;
  }
): FlowrexSignal {
  logger.info('═══════════════════════════════════════════');
  logger.info('⚡ BUILDING FLOWREX SIGNAL...');
  logger.info('═══════════════════════════════════════════\n');

  // If no playbook matched, return neutral signal
  if (!classification.signal) {
    logger.warn('⚠️  No playbook matched - returning neutral signal\n');
    return {
      direction: 'neutral',
      confidence: 0,
      grade: 'C',
      timeframe: metadata.timeframe,
      instrument: metadata.instrument,
      symbol: metadata.symbol,
      playbook: 'NONE',
      primaryPlaybook: 'NONE',
      reasons: ['No playbook conditions met'],
      riskHints: [],
      createdAt: new Date().toISOString(),
    };
  }

  const { signal } = classification;

  // ─────────────────────────────────────────────────────────────
  // 1. Convert direction to signal format
  // ─────────────────────────────────────────────────────────────
  const direction: SignalDirection = signal.direction === 'bullish' ? 'long' : 'short';

  // ─────────────────────────────────────────────────────────────
  // 2. Calculate adjusted confidence
  // ─────────────────────────────────────────────────────────────
  let adjustedConfidence = signal.confidence;

  // Risk adjustments
  const riskFactors: Array<{ factor: string; penalty: number }> = [];

  // Late session penalty (if NY session and close to end)
  if (ctx.session === 'ny') {
    const now = new Date();
    const hour = now.getUTCHours();
    // NY session ends around 21:00 UTC
    if (hour >= 20) {
      riskFactors.push({ factor: 'Late NY session', penalty: 5 });
      adjustedConfidence -= 5;
    }
  }

  // High volatility without displacement (choppy market)
  if (ctx.volatility === 'high' && !ctx.displacement) {
    riskFactors.push({ factor: 'High volatility without clear displacement', penalty: 10 });
    adjustedConfidence -= 10;
  }

  // Asian session lower liquidity
  if (ctx.session === 'asian') {
    riskFactors.push({ factor: 'Asian session (lower liquidity)', penalty: 5 });
    adjustedConfidence -= 5;
  }

  // Against HTF trend (counter-trend trade)
  const isCounterTrend =
    (direction === 'long' && ctx.htfTrend === 'bearish') ||
    (direction === 'short' && ctx.htfTrend === 'bullish');

  if (isCounterTrend) {
    riskFactors.push({ factor: 'Counter-trend trade (against HTF)', penalty: 15 });
    adjustedConfidence -= 15;
  }

  // Confluence boosters
  const confluenceFactors: Array<{ factor: string; boost: number }> = [];

  // Strong confluence: liquidity sweep + structure break + OTE
  if (ctx.liquiditySweep && ctx.structureBreak && ctx.oteRetrace) {
    confluenceFactors.push({ factor: 'Triple confluence (liquidity + structure + OTE)', boost: 10 });
    adjustedConfidence += 10;
  }

  // Volume spike + displacement
  if (ctx.volumeSpike && ctx.displacement) {
    confluenceFactors.push({ factor: 'Strong volume + displacement', boost: 5 });
    adjustedConfidence += 5;
  }

  // Trendline respect
  if (ctx.trendline.exists && ctx.trendline.respected) {
    confluenceFactors.push({ factor: 'Respected trendline', boost: 5 });
    adjustedConfidence += 5;
  }

  // Clamp confidence to 0-100
  adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence));

  // ─────────────────────────────────────────────────────────────
  // 3. Assign quality grade
  // ─────────────────────────────────────────────────────────────
  let grade: SignalGrade;
  if (adjustedConfidence >= 75) {
    grade = 'A';
  } else if (adjustedConfidence >= 50) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Build reasons list
  // ─────────────────────────────────────────────────────────────
  const reasons: string[] = [];

  // Primary playbook reason
  reasons.push(`${signal.playbookName} playbook conditions met`);

  // HTF trend alignment
  if (!isCounterTrend) {
    reasons.push(`Aligned with ${ctx.htfTrend} HTF trend`);
  }

  // Liquidity sweep
  if (ctx.liquiditySweep) {
    reasons.push(`Liquidity sweep detected (${ctx.sweptDirection})`);
  }

  // Structure break
  if (ctx.structureBreak) {
    reasons.push(`Structure break (${ctx.breakDirection})`);
  }

  // OTE retrace
  if (ctx.oteRetrace && ctx.oteLevel) {
    reasons.push(`OTE retrace to ${(ctx.oteLevel * 100).toFixed(1)}% level`);
  }

  // Session context
  reasons.push(`${ctx.session.toUpperCase()} session`);

  // Volume confirmation
  if (ctx.volumeSpike) {
    reasons.push('Volume spike confirmation');
  }

  // Confluence factors
  for (const cf of confluenceFactors) {
    reasons.push(cf.factor);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Build risk hints
  // ─────────────────────────────────────────────────────────────
  const riskHints: string[] = [];

  // Add all risk factors as hints
  for (const rf of riskFactors) {
    riskHints.push(rf.factor);
  }

  // Additional risk hints based on market conditions
  if (ctx.balanceZones.inBalance) {
    riskHints.push('Price in balance zone (potential consolidation)');
  }

  if (!ctx.volumeSpike && !ctx.displacement) {
    riskHints.push('Low volume activity (weaker conviction)');
  }

  if (ctx.volatility === 'low' && signal.playbookName === 'NBB') {
    riskHints.push('Low volatility may limit profit potential');
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Assemble final signal
  // ─────────────────────────────────────────────────────────────
  const flowrexSignal: FlowrexSignal = {
    direction,
    confidence: adjustedConfidence,
    grade,
    timeframe: metadata.timeframe,
    instrument: metadata.instrument,
    symbol: metadata.symbol,
    playbook: signal.playbookName,
    primaryPlaybook: signal.playbookName,
    backupPlaybook: undefined, // Future: implement backup playbook detection
    reasons,
    riskHints,
    createdAt: new Date().toISOString(),
  };

  // ─────────────────────────────────────────────────────────────
  // 7. Log signal summary
  // ─────────────────────────────────────────────────────────────
  logger.success(`✓ Signal generated: ${direction.toUpperCase()} @ ${adjustedConfidence}% (Grade ${grade})`);
  logger.info(`  Playbook: ${signal.playbookName}`);
  logger.info(`  Reasons: ${reasons.length} factors`);
  logger.info(`  Risk Hints: ${riskHints.length} warnings`);
  logger.info('═══════════════════════════════════════════\n');

  return flowrexSignal;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Get HTF trend description
 * ═══════════════════════════════════════════════════════════════
 */
function getTrendDescription(trend: HTFTrend): string {
  switch (trend) {
    case 'bullish':
      return 'bullish';
    case 'bearish':
      return 'bearish';
    case 'neutral':
      return 'neutral/ranging';
    default:
      return 'unknown';
  }
}
