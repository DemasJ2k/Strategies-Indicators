/**
 * ═══════════════════════════════════════════════════════════════
 * SHARED CANDLE TYPE
 * ═══════════════════════════════════════════════════════════════
 * Standard OHLCV candle interface used across the entire application.
 *
 * This is the canonical candle format - all data sources should
 * convert to this format.
 */

export interface Candle {
  time: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // Optional - some data sources don't provide volume
}
