/**
 * ═══════════════════════════════════════════════════════════════
 * BROKER DATA PROVIDER TYPES
 * ═══════════════════════════════════════════════════════════════
 * Standardized interfaces for fetching market data from brokers
 */

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DataProvider {
  /**
   * Fetch historical OHLC candles
   * @param symbol - Trading symbol (e.g., "EURUSD", "BTCUSDT")
   * @param timeframe - Timeframe string (e.g., "1m", "15m", "1h", "4h", "1d")
   * @param limit - Number of candles to fetch
   * @returns Array of candles sorted by time (oldest first)
   */
  fetchOHLC(symbol: string, timeframe: string, limit: number): Promise<Candle[]>;

  /**
   * Subscribe to live candle updates via WebSocket (optional - crypto only)
   * @param symbol - Trading symbol
   * @param timeframe - Timeframe string
   * @param callback - Called on each new candle update
   * @returns Unsubscribe function
   */
  subscribeLive?(
    symbol: string,
    timeframe: string,
    callback: (candle: Candle) => void
  ): Promise<() => void>;
}
