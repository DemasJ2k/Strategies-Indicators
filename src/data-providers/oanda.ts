import axios from 'axios';
import { Candle, DataProvider } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * OANDA DATA PROVIDER (Forex)
 * ═══════════════════════════════════════════════════════════════
 * Fetches historical OHLC data from OANDA REST API
 */

const OANDA_BASE =
  process.env.OANDA_ENV === 'live'
    ? 'https://api-fxtrade.oanda.com/v3'
    : 'https://api-fxpractice.oanda.com/v3';

export const OandaProvider: DataProvider = {
  async fetchOHLC(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const granularity = mapTimeframe(timeframe);

    const url = `${OANDA_BASE}/instruments/${symbol}/candles?granularity=${granularity}&count=${limit}&price=M`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.OANDA_API_KEY}`,
      },
    });

    return res.data.candles.map((c: any) => ({
      time: Math.floor(new Date(c.time).getTime() / 1000),
      open: parseFloat(c.mid.o),
      high: parseFloat(c.mid.h),
      low: parseFloat(c.mid.l),
      close: parseFloat(c.mid.c),
      volume: c.volume,
    }));
  },
};

/**
 * Map generic timeframe to OANDA granularity
 */
function mapTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '1m': 'M1',
    '5m': 'M5',
    '15m': 'M15',
    '30m': 'M30',
    '1h': 'H1',
    '4h': 'H4',
    '1d': 'D',
  };
  return map[tf] || 'M15';
}
