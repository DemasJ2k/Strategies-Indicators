export interface MarketData {
  price: number;
  high: number;
  low: number;
  volume: number;
  htfTrend: 'bullish' | 'bearish' | 'neutral';
  session: 'asian' | 'london' | 'ny';
  liquidityZones: {
    high: number[];
    low: number[];
    swept: { level: number; direction: 'high' | 'low' }[];
  };
  trendline: {
    exists: boolean;
    touches: number;
    respected: boolean;
  };
  balanceZones: {
    inBalance: boolean;
    lvnDetected: boolean;
  };
  volatility: 'high' | 'low';
  previousDayHigh: number;
  previousDayLow: number;
}
