export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface AnalyzeResponse {
  id: string;
  timestamp: string;
  context: any;
  classification: any;
  tradePlan: any;
}
