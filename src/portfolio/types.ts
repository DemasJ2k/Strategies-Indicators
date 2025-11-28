export interface PortfolioPosition {
  symbol: string;         // e.g. EURUSD or BTCUSDT
  direction: 'long' | 'short';
  size: number;           // lots for forex, units for crypto
  entryPrice: number;
  currentPrice: number;
  instrument: 'FOREX' | 'CRYPTO' | 'CFD';
}

export interface PositionExposure {
  symbol: string;
  netExposure: number;    // signed: long positive, short negative
  riskValue: number;      // value at risk based on distance to stop
  normalizedRisk: number; // 0-100 scaled risk unit
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];     // NxN correlation values
}

export interface BasketRisk {
  score: number;          // 0–100 risk score
  volatility: number;     // portfolio volatility
  usdExposure: number;    // net USD flow
  jpyExposure: number;
  diversificationScore: number; // 0–100
  alerts: string[];
}

export interface PortfolioRadar {
  exposure: PositionExposure[];
  correlationMatrix: CorrelationMatrix;
  basket: BasketRisk;
  timestamp: string;
}
