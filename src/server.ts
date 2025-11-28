import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { buildMarketContext, RawMarketData } from '@agent/context';
import { classifyMarket } from '@agent/classifier';
import { buildSignal } from '@signals/signalEngine';
import { getProvider } from '@data-providers/index';
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

// Helper to validate webhook secrets
function validateWebhookSecret(req: Request, expectedSecret: string | undefined): boolean {
  if (!expectedSecret) {
    // If no secret configured, allow request (dev mode)
    return true;
  }
  const providedSecret = req.header('x-flowrex-secret');
  return providedSecret === expectedSecret;
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
 * Convert HTTP request body to RawMarketData and run analysis
 */
async function runAnalysisFromBody(body: any, routeLabel: string) {
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

  const result = {
    id: genId(routeLabel),
    timestamp: new Date().toISOString(),
    instrument: body.instrument || 'UNKNOWN',
    timeframe: body.timeframe || '15m',
    context: marketContext,
    classification,
    signal, // ⚡ NEW: Unified Flowrex signal
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

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /analyze
 * ═══════════════════════════════════════════════════════════════
 * Main endpoint for analyzing market data
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
    // Validate secret
    if (!validateWebhookSecret(req, process.env.TV_WEBHOOK_SECRET)) {
      logger.warn('Unauthorized TradingView webhook attempt');
      return res.status(403).json({ error: 'Forbidden - Invalid secret' });
    }

    const body = req.body;
    const result = await runAnalysisFromBody(body, '/webhook/tradingview');

    // Broadcast to all connected clients
    io.emit('liveAnalysis', {
      source: 'tradingview',
      symbol: body.symbol,
      instrument: body.instrument,
      timeframe: body.timeframe,
      candles: body.candles,
      signal: result.signal, // ⚡ Include Flowrex signal
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
    // Validate secret
    if (!validateWebhookSecret(req, process.env.MT5_WEBHOOK_SECRET)) {
      logger.warn('Unauthorized MT5 webhook attempt');
      return res.status(403).json({ error: 'Forbidden - Invalid secret' });
    }

    const body = req.body;
    const result = await runAnalysisFromBody(body, '/webhook/mt5');

    // Broadcast to all connected clients
    io.emit('liveAnalysis', {
      source: 'mt5',
      symbol: body.symbol,
      instrument: body.instrument,
      timeframe: body.timeframe,
      candles: body.candles,
      signal: result.signal, // ⚡ Include Flowrex signal
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
 * GET /data/ohlc
 * ═══════════════════════════════════════════════════════════════
 * Fetch historical OHLC data from broker/exchange
 * Query params: provider, symbol, timeframe, limit
 */
app.get('/data/ohlc', async (req: Request, res: Response) => {
  try {
    const { provider, symbol, timeframe, limit } = req.query as any;

    if (!provider || !symbol || !timeframe) {
      return res.status(400).json({
        error: 'Missing required parameters: provider, symbol, timeframe',
      });
    }

    const dataProvider = getProvider(provider.toUpperCase());
    if (!dataProvider) {
      return res.status(400).json({
        error: `Unknown provider: ${provider}. Available: OANDA, FXCM, BINANCE, BYBIT`,
      });
    }

    const candleLimit = Number(limit || 200);
    const candles = await dataProvider.fetchOHLC(symbol, timeframe, candleLimit);

    logger.info(
      `✓ Fetched ${candles.length} candles from ${provider.toUpperCase()} for ${symbol} ${timeframe}`
    );

    res.json({ candles });
  } catch (err: any) {
    logger.error('Error fetching OHLC data:', err);
    res.status(500).json({
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
  logger.info(`   GET  http://localhost:${PORT}/data/ohlc`);
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
