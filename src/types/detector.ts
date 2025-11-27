export interface TrendDetectorOutput {
  htfTrend: 'bullish' | 'bearish' | 'neutral';
  strength: number;
}

export interface LiquidityDetectorOutput {
  zones: {
    high: number[];
    low: number[];
  };
  swept: {
    level: number;
    direction: 'high' | 'low';
  }[];
}

export interface SessionInfo {
  current: 'asian' | 'london' | 'ny';
  isActive: boolean;
}

export interface VolumeProfile {
  total: number;
  spike: boolean;
  displacement: boolean;
}
