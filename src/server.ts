import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { runAgent } from '@agent/agent';
import { Candle } from '@custom-types/candle';
import { createLogger } from '@utils/agent_logger';

const logger = createLogger('Server');
const app = express();
const PORT = process.env.PORT || 4000;

// HTTP server + Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`❌ Client disconnected: ${socket.id}`);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * REUSABLE ANALYSIS HELPER
 * ═══════════════════════════════════════════════════════════════
 * Factored out logic for analyze + webhooks
 */
async function runAnalysisFromBody(body: any, routeLabel: string) {
  const candles: Candle[] = body.candles || [];

  if (!body.instrument || !body.timeframe || candles.length < 3) {
    throw new Error('Missing instrument/timeframe or not enough candles');
  }

  const last = candles[candles.length - 1];
  const overrideConfig = body.overrideConfig;

  // Build RawMarketData with multi-timeframe support
  const raw: RawMarketData = {
    instrument: body.instrument,
    timeframe: body.timeframe,
    timestamp: new Date(last.time || Date.now()).toISOString(),

    // Multi-TF arrays - can now be different
    htfCandles: body.htfCandles || candles,
    executionCandles: candles,
    candles4H: body.candles4H || body.htfCandles || candles,

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

    // Override configuration from UI settings
    overrideConfig: overrideConfig ?? null,
  };

  // Build market context (runs all detectors)
  const ctx = buildMarketContext(raw);

  // Run agent to generate trade plan
  const tradePlan = await runAgent(ctx);

  // Classify playbook
  const classification = classifyMarket(ctx);

  const result = {
    id: genId(routeLabel),
    timestamp: ctx.timestamp,
    context: ctx,
    classification,
    tradePlan,
  };

  logger.info(
    `✓ Analysis complete [${routeLabel}]: ${body.instrument} ${body.timeframe} (${candles.length} candles)`
  );

  return result;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /analyze
 * ═══════════════════════════════════════════════════════════════
 * Main endpoint for analyzing market data with multi-timeframe support
 */
app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const result = await runAnalysisFromBody(req.body, '/analyze');
    res.json(result);
  } catch (err: any) {
    logger.error('Error in /analyze:', err);
    res.status(400).json({
      error: String(err?.message || err),
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /webhook/tradingview
 * ═══════════════════════════════════════════════════════════════
 * Webhook for TradingView alerts with live broadcast
 */
app.post('/webhook/tradingview', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const result = await runAnalysisFromBody(body, '/webhook/tradingview');

    // Broadcast to all connected clients
    io.emit('liveAnalysis', {
      source: 'tradingview',
      symbol: body.symbol,
      instrument: body.instrument,
      timeframe: body.timeframe,
      candles: body.candles,
      result,
    });

    res.json({ ok: true, resultId: result.id });
  } catch (err: any) {
    logger.error('Error in /webhook/tradingview:', err);
    res.status(400).json({
      error: String(err?.message || err),
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /webhook/mt5
 * ═══════════════════════════════════════════════════════════════
 * Webhook for MT5 EA with live broadcast
 */
app.post('/webhook/mt5', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const result = await runAnalysisFromBody(body, '/webhook/mt5');

    // Broadcast to all connected clients
    io.emit('liveAnalysis', {
      source: 'mt5',
      symbol: body.symbol,
      instrument: body.instrument,
      timeframe: body.timeframe,
      candles: body.candles,
      result,
    });

    res.json({ ok: true, resultId: result.id });
  } catch (err: any) {
    logger.error('Error in /webhook/mt5:', err);
    res.status(400).json({
      error: String(err?.message || err),
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
httpServer.listen(PORT, () => {
  logger.success(`═══════════════════════════════════════════════════`);
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.success(`═══════════════════════════════════════════════════`);
  logger.info(`\n📡 Endpoints:`);
  logger.info(`   POST http://localhost:${PORT}/analyze`);
  logger.info(`   POST http://localhost:${PORT}/webhook/tradingview`);
  logger.info(`   POST http://localhost:${PORT}/webhook/mt5`);
  logger.info(`   GET  http://localhost:${PORT}/health`);
  logger.info(`\n🔌 WebSocket: Socket.IO ready for live updates\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
