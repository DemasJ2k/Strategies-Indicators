import axios from 'axios';
import { Candle, DataProvider } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * BYBIT DATA PROVIDER (Crypto)
 * ═══════════════════════════════════════════════════════════════
 * Fetches historical OHLC data from Bybit REST API
 */

export const BybitProvider: DataProvider = {
  async fetchOHLC(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${mapTimeframe(
      timeframe
    )}&limit=${limit}`;

    const res = await axios.get(url);

    return res.data.result.list.map((c: any) => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  },
};

/**
 * Map generic timeframe to Bybit interval format
 */
function mapTimeframe(tf: string): number | string {
  const map: Record<string, number | string> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 'D',
  };
  return map[tf] || 15;
}
