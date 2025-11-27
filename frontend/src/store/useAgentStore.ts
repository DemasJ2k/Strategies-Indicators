import { create } from 'zustand';
import { AnalyzeResponse } from '../lib/types';

export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface AgentState {
  result: AnalyzeResponse | null;

  // Execution TF candles (main)
  candles: Candle[];

  // Higher timeframe candles (e.g., 4H / Daily)
  htfCandles: Candle[];

  // Optional dedicated 4H set for Tori (can just mirror htfCandles)
  candles4H: Candle[];

  instrument: string;
  timeframe: string;

  setResult: (r: AnalyzeResponse | null) => void;
  setExecutionCandles: (c: Candle[], instrument: string, timeframe: string) => void;
  setHTFCandles: (c: Candle[]) => void;
  setCandles4H: (c: Candle[]) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  result: null,
  candles: [],
  htfCandles: [],
  candles4H: [],
  instrument: 'FOREX',
  timeframe: '15m',

  setResult: (r) => set({ result: r }),
  setExecutionCandles: (candles, instrument, timeframe) =>
    set({ candles, instrument, timeframe }),
  setHTFCandles: (htfCandles) => set({ htfCandles }),
  setCandles4H: (candles4H) => set({ candles4H }),
}));
