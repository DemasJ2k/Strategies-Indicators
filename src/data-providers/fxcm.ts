import axios from 'axios';
import { Candle, DataProvider } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * FXCM DATA PROVIDER (Forex)
 * ═══════════════════════════════════════════════════════════════
 * Fetches historical OHLC data from FXCM REST API
 */

const FXCM_BASE = 'https://api.fxcm.com';

export const FxcmProvider: DataProvider = {
  async fetchOHLC(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const url = `${FXCM_BASE}/candles/${symbol}/${mapTimeframe(timeframe)}?num=${limit}`;

    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Flowrex',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FXCM_API_KEY}`,
      },
    });

    return res.data.candles.map((c: any) => ({
      time: Math.floor(new Date(c[0]).getTime() / 1000),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
    }));
  },
};

/**
 * Map generic timeframe to FXCM format
 */
function mapTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '1m': 'm1',
    '5m': 'm5',
    '15m': 'm15',
    '30m': 'm30',
    '1h': 'H1',
    '4h': 'H4',
    '1d': 'D1',
  };
  return map[tf] || 'm15';
}
