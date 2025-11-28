export interface RawCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time?: number;
}

export interface RawMarketData {
  candles: RawCandle[];
  previousDayHigh: number;
  previousDayLow: number;
}
