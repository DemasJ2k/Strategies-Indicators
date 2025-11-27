import { Candle } from '@custom-types/candle';

/**
 * ═══════════════════════════════════════════════════════════════
 * TRADINGVIEW WEBHOOK PARSER
 * ═══════════════════════════════════════════════════════════════
 * Helper to parse TradingView webhook payloads.
 *
 * Use Case:
 * - TradingView alerts send webhooks to your REST server
 * - This function parses the payload into a usable format
 * - Adapt to your specific alert message structure
 *
 * TradingView Alert Example:
 * ```
 * {
 *   "symbol": "{{ticker}}",
 *   "interval": "{{interval}}",
 *   "close": "{{close}}",
 *   "volume": "{{volume}}",
 *   "time": "{{time}}"
 * }
 * ```
 */

export interface TradingViewWebhookPayload {
  symbol?: string;
  interval?: string;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  time?: number;
  candles?: Candle[]; // Optional: array of candles if sent
  action?: string; // Optional: 'buy', 'sell', 'alert'
  message?: string; // Optional: alert message
  [key: string]: any; // Allow additional fields
}

export interface ParsedWebhookOutput {
  symbol: string;
  interval: string;
  candles: Candle[] | null;
  currentPrice?: number;
  action?: string;
  message?: string;
}

/**
 * Parse TradingView webhook payload
 *
 * This is intentionally simple - adapt it to your actual alert format.
 * TradingView doesn't automatically send full candle arrays, so you'll
 * need to manually construct them or maintain state.
 *
 * @param payload - Raw webhook payload from TradingView
 * @returns Parsed webhook data
 *
 * @example
 * ```typescript
 * // Express.js webhook endpoint
 * app.post('/webhook/tradingview', (req, res) => {
 *   const parsed = parseTradingViewWebhook(req.body);
 *   console.log('Alert:', parsed.symbol, parsed.action);
 *   res.sendStatus(200);
 * });
 * ```
 */
export function parseTradingViewWebhook(payload: TradingViewWebhookPayload): ParsedWebhookOutput {
  // Extract symbol (default to UNKNOWN if not provided)
  const symbol = payload.symbol || payload.ticker || 'UNKNOWN';

  // Extract interval (default to 5m)
  const interval = payload.interval || payload.timeframe || '5m';

  // Extract candles if provided (rare - usually need to build from alerts)
  const candles = payload.candles || null;

  // Extract current price (from close, last, or price field)
  const currentPrice = payload.close || payload.last || payload.price;

  // Extract action (buy, sell, alert)
  const action = payload.action || payload.strategy || undefined;

  // Extract message
  const message = payload.message || payload.text || undefined;

  return {
    symbol,
    interval,
    candles,
    currentPrice,
    action,
    message,
  };
}

/**
 * Convert single TradingView alert to a Candle
 *
 * TradingView alerts typically send OHLCV data for the current bar.
 * This function converts that into a Candle object.
 *
 * @param payload - TradingView webhook payload
 * @returns Candle object or null if insufficient data
 */
export function tradingViewAlertToCandle(payload: TradingViewWebhookPayload): Candle | null {
  // Need at least time and close
  if (!payload.time || !payload.close) {
    return null;
  }

  // Use provided OHLC values, or default to close
  const open = payload.open || payload.close;
  const high = payload.high || payload.close;
  const low = payload.low || payload.close;
  const close = payload.close;
  const volume = payload.volume;

  return {
    time: payload.time,
    open,
    high,
    low,
    close,
    volume,
  };
}

/**
 * Validate TradingView webhook signature (security)
 *
 * TradingView doesn't provide built-in webhook signatures,
 * but you can add a secret token to your alert message.
 *
 * @param payload - Webhook payload
 * @param expectedSecret - Your secret token
 * @returns boolean - true if valid
 *
 * @example
 * ```typescript
 * // In your TradingView alert, include:
 * // { "secret": "your-secret-token", ... }
 *
 * if (!validateWebhookSecret(req.body, process.env.TV_SECRET)) {
 *   return res.status(401).send('Unauthorized');
 * }
 * ```
 */
export function validateWebhookSecret(payload: any, expectedSecret: string): boolean {
  if (!payload.secret) {
    return false;
  }

  return payload.secret === expectedSecret;
}

/**
 * Build a simple REST server example for TradingView webhooks
 *
 * Note: This is just a reference - you'd implement this separately
 * using Express, Fastify, or your preferred framework.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { parseTradingViewWebhook } from './tradingview_webhook';
 *
 * const app = express();
 * app.use(express.json());
 *
 * app.post('/webhook/tradingview', (req, res) => {
 *   try {
 *     const data = parseTradingViewWebhook(req.body);
 *     console.log('Received alert:', data);
 *
 *     // Process the alert
 *     // - Run your agent
 *     // - Send to database
 *     // - Trigger trades
 *
 *     res.sendStatus(200);
 *   } catch (error) {
 *     console.error('Webhook error:', error);
 *     res.status(400).send('Invalid payload');
 *   }
 * });
 *
 * app.listen(3000, () => {
 *   console.log('Webhook server listening on port 3000');
 * });
 * ```
 */
export const WEBHOOK_SERVER_EXAMPLE = `
Example TradingView webhook server setup:

1. Create webhook endpoint (Express, Fastify, etc.)
2. Configure TradingView alert to POST to your server
3. Parse payload using parseTradingViewWebhook()
4. Process alert (run agent, log, trade, etc.)
5. Respond with 200 OK

Alert Message Format (in TradingView):
{
  "secret": "your-secret",
  "symbol": "{{ticker}}",
  "interval": "{{interval}}",
  "close": {{close}},
  "volume": {{volume}},
  "time": {{time}},
  "action": "buy"
}
`;
