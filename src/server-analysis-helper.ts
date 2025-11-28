import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { buildSignal } from '@signals/signalEngine';
import { createLogger } from '@utils/agent_logger';
import { saveSignal } from './journal/journalService';

const logger = createLogger('AnalysisHelper');

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * REUSABLE ANALYSIS HELPER
 * ═══════════════════════════════════════════════════════════════
 * Convert HTTP request body to RawMarketData and run analysis
 */
export async function runAnalysisFromBody(body: any, routeLabel: string) {
  const candles = body.candles || [];

  if (candles.length < 3) {
    throw new Error('Not enough candles (minimum 3 required)');
  }

  // Convert to RawMarketData format
  const rawData: RawMarketData = {
    candles: candles.map((c: any) => ({
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 1000000),
      time: c.time,
    })),
    previousDayHigh: body.pdh || candles[candles.length - 1].high,
    previousDayLow: body.pdl || candles[candles.length - 1].low,
  };

  // Build market context (runs all detectors)
  const marketContext = buildMarketContext(rawData);

  // Classify playbook
  const classification = classifyMarket(marketContext);

  // Build unified Flowrex signal
  const signal = buildSignal(marketContext, classification, {
    instrument: body.instrument || 'UNKNOWN',
    timeframe: body.timeframe || '15m',
    symbol: body.symbol,
  });

  // Auto-journal the signal to database
  let signalId: string | null = null;
  try {
    signalId = await saveSignal(signal, marketContext, routeLabel.replace('/', ''));
    logger.info(`✓ Signal saved to database: ${signalId}`);
  } catch (e) {
    logger.error('Error saving signal to database:', e);
    // Continue even if DB save fails
  }

  const result = {
    id: genId(routeLabel),
    timestamp: new Date().toISOString(),
    instrument: body.instrument || 'UNKNOWN',
    timeframe: body.timeframe || '15m',
    context: marketContext,
    classification,
    signal, // ⚡ Unified Flowrex signal
    signalId, // Database signal ID for linking trades
    tradePlan: {
      playbook: classification.signal?.playbookName || 'NONE',
      direction: classification.signal?.direction || 'NONE',
      session: classification.signal?.session || 'UNKNOWN',
      confidence: classification.signal?.confidence || 0,
      context: classification.signal?.context || '',
      tpLogic: classification.signal?.tpLogic || '',
      overlays: {}, // Placeholder for chart overlays
    },
  };

  logger.info(
    `✓ Analysis complete [${routeLabel}]: ${body.instrument} ${body.timeframe} (${candles.length} candles) → ${signal.playbook} (${signal.direction.toUpperCase()} @ ${signal.confidence}% / Grade ${signal.grade})`
  );

  return result;
}
