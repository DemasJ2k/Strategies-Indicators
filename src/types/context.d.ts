export type HTFTrend = 'bullish' | 'bearish' | 'neutral';
export type Session = 'asian' | 'london' | 'ny';
export type Direction = 'bullish' | 'bearish';

export interface LiquidityZone {
  level: number;
  type: 'high' | 'low';
  swept: boolean;
}

export interface MarketContext {
  session: Session;
  htfTrend: HTFTrend;
  price: number;
  high: number;
  low: number;
  volume: number;

  // HTF context
  po3ZonePresent: boolean; // premium/discount zone present?
  priceAtPO3: boolean; // is price at PO3?

  // Liquidity
  liquiditySweep: boolean; // did liquidity sweep occur?
  sweptDirection: 'high' | 'low' | null;
  liquidityZones: LiquidityZone[];

  // Structure
  structureBreak: boolean; // break of structure?
  breakDirection: 'bullish' | 'bearish' | null;

  // Volume
  volumeSpike: boolean;
  displacement: boolean;

  // OTE (Optimal Trade Entry)
  oteRetrace: boolean; // did price retrace to OTE level?
  oteLevel: number | null; // 0.62, 0.705, 0.79 Fib level
}

// New: Action / Signal / Playbook Profile
export interface PlaybookSignal {
  playbookName: string;
  direction: Direction;
  context: string; // e.g., "HTF bullish + swept low + OTE at 0.705"
  tpLogic: string; // e.g., "Target = Previous Day High or MSS"
  confidence: number; // 0-100
  session: Session;
}

export interface ClassifierOutput {
  signal: PlaybookSignal | null;
  priority: number; // 1 = NBB, 2 = JadeCap, 3 = Tori, 4 = Fabio
  timestamp: Date;
}
