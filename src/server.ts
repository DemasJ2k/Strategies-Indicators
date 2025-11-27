import express, { Request, Response } from 'express';
import cors from 'cors';
import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { runAgent } from '@agent/agent';
import { Candle } from '@custom-types/candle';
import { createLogger } from '@utils/agent_logger';

const logger = createLogger('Server');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /analyze
 * ═══════════════════════════════════════════════════════════════
 * Main endpoint for analyzing market data with multi-timeframe support
 */
app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const candles: Candle[] = body.candles || [];

    // Validation
    if (!body.instrument || !body.timeframe || candles.length < 3) {
      return res.status(400).json({
        error: 'Missing instrument/timeframe or not enough candles',
      });
    }

    const last = candles[candles.length - 1];

    // Build RawMarketData with multi-timeframe support
    const raw: RawMarketData = {
      instrument: body.instrument,
      timeframe: body.timeframe,
      timestamp: new Date(last.time || Date.now()).toISOString(),

      // Multi-TF arrays - can now be different
      htfCandles: body.htfCandles || candles,        // Higher timeframe (4H/Daily)
      executionCandles: candles,                      // Main execution timeframe
      candles4H: body.candles4H || body.htfCandles || candles, // Dedicated 4H for Tori

      lastPrice: last.close,

      // Session levels
      pdh: body.pdh,
      pdl: body.pdl,
      asianHigh: body.asianHigh,
      asianLow: body.asianLow,
      londonHigh: body.londonHigh,
      londonLow: body.londonLow,

      // Additional context
      adrPct: body.adrPct ?? 1.0,
      volumeProfile: body.volumeProfile ?? null,
    };

    // Build market context (runs all detectors)
    const ctx = buildMarketContext(raw);

    // Run agent to generate trade plan
    const tradePlan = await runAgent(ctx);

    // Classify playbook
    const classification = classifyMarket(ctx);

    // Return complete analysis
    res.json({
      id: genId('analyze'),
      timestamp: ctx.timestamp,
      context: ctx,
      classification,
      tradePlan,
    });

    logger.info(`✓ Analysis complete: ${body.instrument} ${body.timeframe} (${candles.length} candles)`);
  } catch (err: any) {
    logger.error('Error in /analyze:', err);
    res.status(500).json({
      error: 'Internal server error',
      detail: String(err?.message || err),
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * GET /health
 * ═══════════════════════════════════════════════════════════════
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Market Playbook Agent API',
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * Start Server
 * ═══════════════════════════════════════════════════════════════
 */
app.listen(PORT, () => {
  logger.success(`═══════════════════════════════════════════════════`);
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.success(`═══════════════════════════════════════════════════`);
  logger.info(`\n📡 Endpoints:`);
  logger.info(`   POST http://localhost:${PORT}/analyze`);
  logger.info(`   GET  http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
