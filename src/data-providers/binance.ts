import axios from 'axios';
import WebSocket from 'ws';
import { Candle, DataProvider } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * BINANCE DATA PROVIDER (Crypto / Futures)
 * ═══════════════════════════════════════════════════════════════
 * Fetches historical OHLC data from Binance REST API
 * Supports live WebSocket streaming
 */

export const BinanceProvider: DataProvider = {
  async fetchOHLC(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${mapTimeframe(
      timeframe
    )}&limit=${limit}`;

    const res = await axios.get(url);

    return res.data.map((c: any) => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  },

  async subscribeLive(
    symbol: string,
    timeframe: string,
    callback: (candle: Candle) => void
  ): Promise<() => void> {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${mapTimeframe(timeframe)}`
    );

    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (!data.k) return;

      const k = data.k;
      callback({
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      });
    });

    // Return unsubscribe function
    return () => ws.close();
  },
};

/**
 * Map generic timeframe to Binance interval format
 */
function mapTimeframe(tf: string): string {
  // Binance uses lowercase (1m, 5m, 15m, 1h, 4h, 1d)
  return tf.toLowerCase();
}
