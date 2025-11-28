import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { getProvider } from '@data-providers/index';
import { createLogger } from '@utils/agent_logger';
import { runAnalysisFromBody } from './server-analysis-helper';
import { startLiveStream, stopLiveStream } from './live/liveRouter';
import { computeExposure } from '@portfolio/exposure';
import { computeCorrelationMatrix } from '@portfolio/correlation';
import { computeBasketRisk } from '@portfolio/riskEngine';
import { createTrade, closeTrade, listRecentTrades } from './journal/journalService';
import { openai } from './ai/openaiClient';
import { buildAssistantContext } from './assistant/contextBuilder';
import type { PortfolioPosition } from '@portfolio/types';

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

// Export io for use in live router
export { io };

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
 * POST /data/live/start
 * ═══════════════════════════════════════════════════════════════
 * Start live market data stream from a broker
 */
app.post('/data/live/start', async (req: Request, res: Response) => {
  try {
    const { provider, symbol, timeframe } = req.body;
    if (!provider || !symbol || !timeframe) {
      return res.status(400).json({ error: 'provider, symbol, timeframe required' });
    }

    await startLiveStream(io, { provider, symbol, timeframe });
    logger.info(`📡 Started live stream: ${provider} ${symbol} ${timeframe}`);
    res.json({ ok: true });
  } catch (err: any) {
    logger.error('Error starting live stream:', err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /data/live/stop
 * ═══════════════════════════════════════════════════════════════
 * Stop live market data stream
 */
app.post('/data/live/stop', (req: Request, res: Response) => {
  try {
    const { provider, symbol, timeframe } = req.body;
    if (!provider || !symbol || !timeframe) {
      return res.status(400).json({ error: 'provider, symbol, timeframe required' });
    }

    stopLiveStream({ provider, symbol, timeframe });
    logger.info(`⏹️  Stopped live stream: ${provider} ${symbol} ${timeframe}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /portfolio/radar
 * ═══════════════════════════════════════════════════════════════
 * Portfolio risk analysis endpoint
 */
app.post('/portfolio/radar', async (req: Request, res: Response) => {
  try {
    const { positions, priceHistory, balance } = req.body;

    if (!positions || !priceHistory) {
      return res.status(400).json({ error: 'positions and priceHistory required' });
    }

    const exposures = computeExposure(positions, balance || 5000);
    const corr = computeCorrelationMatrix(positions, priceHistory);
    const basket = computeBasketRisk(positions, corr, exposures, balance || 5000);

    logger.info(
      `✓ Portfolio radar analysis complete: ${positions.length} positions, risk score ${basket.score.toFixed(1)}`
    );

    res.json({
      exposure: exposures,
      correlationMatrix: corr,
      basket,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Error in /portfolio/radar:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /journal/trades
 * ═══════════════════════════════════════════════════════════════
 * Create a new trade journal entry
 */
app.post('/journal/trades', async (req: Request, res: Response) => {
  try {
    const trade = await createTrade(req.body);
    logger.info(`✓ Trade created: ${trade.id} - ${trade.symbol} ${trade.direction}`);
    res.json(trade);
  } catch (err: any) {
    logger.error('Error creating trade:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /journal/trades/:id/close
 * ═══════════════════════════════════════════════════════════════
 * Close an existing trade with exit price and time
 */
app.post('/journal/trades/:id/close', async (req: Request, res: Response) => {
  try {
    const { exitPrice, exitTime } = req.body;
    const trade = await closeTrade(req.params.id, exitPrice, exitTime);
    logger.info(`✓ Trade closed: ${trade.id} - PnL: ${trade.pnl}`);
    res.json(trade);
  } catch (err: any) {
    logger.error('Error closing trade:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * GET /journal/trades
 * ═══════════════════════════════════════════════════════════════
 * List recent trades with optional limit
 */
app.get('/journal/trades', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 50);
    const trades = await listRecentTrades(limit);
    res.json(trades);
  } catch (err: any) {
    logger.error('Error listing trades:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /assistant/chat
 * ═══════════════════════════════════════════════════════════════
 * AI Chat Assistant powered by OpenAI
 */
app.post('/assistant/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      includeSignals,
      includeTrades,
      includePortfolio,
      latestAnalysis,
      portfolioPositions,
      accountBalance,
    } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build context from DB + optional latestAnalysis
    const ctx = await buildAssistantContext(
      {
        includeSignals: !!includeSignals,
        includeTrades: !!includeTrades,
        includePortfolio: !!includePortfolio,
      },
      latestAnalysis
    );

    // Optionally compute portfolio radar on the fly
    if (includePortfolio && Array.isArray(portfolioPositions)) {
      const positions = portfolioPositions as PortfolioPosition[];
      // You might want real price history here; to keep it simple we omit for now
      const fakePriceHistory: Record<string, number[]> = {};
      const exposures = computeExposure(positions, accountBalance || 5000);
      const corr = computeCorrelationMatrix(positions, fakePriceHistory);
      const basket = computeBasketRisk(positions, corr, exposures, accountBalance || 5000);

      ctx.portfolioRadar = { exposures, corr, basket };
    }

    const systemPrompt = `
You are Flowrex, an institutional-grade AI trading assistant for forex and crypto.

User profile:
- Intermediate to advanced retail trader.
- Uses multiple playbooks (NBB, Tori, Fabio, JadeCap).
- Wants systematic, data-driven trading with strong risk management.

Capabilities:
- Explain the latest AI signal and playbook choice.
- Analyze risk, correlations, and exposure when portfolio data is provided.
- Review recent journal trades and signals and highlight patterns, strengths, and weaknesses.
- Never give broker-specific execution advice (no "click buy now"), focus on education, risk, and planning.
- Default to conservative, professional risk management.

Context JSON (do NOT dump it raw; summarize it usefully):
${JSON.stringify(ctx).slice(0, 8000)}
    `.trim();

    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content || '(no reply)';

    logger.info(`✓ AI assistant response generated (${reply.length} chars)`);

    res.json({ reply });
  } catch (err: any) {
    logger.error('Error in /assistant/chat:', err);
    res.status(500).json({ error: String(err.message || err) });
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
  logger.info(`   POST http://localhost:${PORT}/data/live/start`);
  logger.info(`   POST http://localhost:${PORT}/data/live/stop`);
  logger.info(`   POST http://localhost:${PORT}/portfolio/radar`);
  logger.info(`   POST http://localhost:${PORT}/journal/trades`);
  logger.info(`   POST http://localhost:${PORT}/journal/trades/:id/close`);
  logger.info(`   GET  http://localhost:${PORT}/journal/trades`);
  logger.info(`   POST http://localhost:${PORT}/assistant/chat`);
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
