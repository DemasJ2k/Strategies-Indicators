// src/live/liveRouter.ts
import { getProvider } from '@data-providers/index';
import type { Candle } from '@data-providers/types';
import type { Server as SocketIOServer } from 'socket.io';
import { runAnalysisFromBody } from '../server-analysis-helper';

interface LiveStreamKey {
  provider: string;
  symbol: string;
  timeframe: string;
}

interface LiveStream {
  stop: () => void;
}

const streams = new Map<string, LiveStream>();

function keyOf(p: LiveStreamKey) {
  return `${p.provider}:${p.symbol}:${p.timeframe}`;
}

export async function startLiveStream(
  io: SocketIOServer,
  params: LiveStreamKey
) {
  const { provider, symbol, timeframe } = params;
  const p = getProvider(provider.toUpperCase());
  if (!p) throw new Error('Unknown provider: ' + provider);

  const k = keyOf(params);
  if (streams.has(k)) {
    // already running
    return;
  }

  // We'll store last N candles so we can run the full agent on each update
  const buffer: Candle[] = [];

  // 1) Bootstrap with some history
  const initial = await p.fetchOHLC(symbol, timeframe, 200);
  buffer.push(...initial);

  // Emit initial data
  io.emit('liveCandleBatch', {
    provider,
    symbol,
    timeframe,
    candles: buffer,
  });

  let stopFn: () => void = () => {};

  if (p.subscribeLive) {
    // 2) Use WS streaming (e.g., Binance)
    stopFn = await p.subscribeLive(symbol, timeframe, async (candle) => {
      buffer.push(candle);
      if (buffer.length > 500) buffer.shift();

      io.emit('liveCandle', {
        provider,
        symbol,
        timeframe,
        candle,
      });

      // Auto-run analysis on each new candle
      const body = {
        symbol,
        instrument: provider.toUpperCase() === 'BINANCE' ? 'CRYPTO' : 'FOREX',
        timeframe,
        candles: buffer,
      };

      const result = await runAnalysisFromBody(body, '/live/router');
      io.emit('liveAnalysis', {
        source: 'live-router',
        symbol,
        instrument: body.instrument,
        timeframe,
        candles: buffer,
        result,
      });
    });
  } else {
    // 2b) Fallback: poll REST for brokers with no WS (OANDA / FXCM)
    const interval = setInterval(async () => {
      try {
        const latest = await p.fetchOHLC(symbol, timeframe, 5);
        // merge new candles
        latest.forEach((c) => {
          const last = buffer[buffer.length - 1];
          if (!last || c.time > last.time) {
            buffer.push(c);
          } else if (c.time === last.time) {
            buffer[buffer.length - 1] = c;
          }
        });
        if (buffer.length > 500) buffer.splice(0, buffer.length - 500);

        const last = buffer[buffer.length - 1];
        if (!last) return;

        io.emit('liveCandle', {
          provider,
          symbol,
          timeframe,
          candle: last,
        });

        const body = {
          symbol,
          instrument: provider.toUpperCase().includes('OANDA') ? 'FOREX' : 'CFD',
          timeframe,
          candles: buffer,
        };

        const result = await runAnalysisFromBody(body, '/live/router');
        io.emit('liveAnalysis', {
          source: 'live-router',
          symbol,
          instrument: body.instrument,
          timeframe,
          candles: buffer,
          result,
        });
      } catch (e) {
        console.error('Polling error for live stream', provider, symbol, timeframe, e);
      }
    }, 10_000); // every 10s

    stopFn = () => clearInterval(interval);
  }

  streams.set(k, { stop: stopFn });
}

export function stopLiveStream(params: LiveStreamKey) {
  const k = keyOf(params);
  const s = streams.get(k);
  if (s) {
    s.stop();
    streams.delete(k);
  }
}

export function stopAllLiveStreams() {
  streams.forEach((s) => s.stop());
  streams.clear();
}
