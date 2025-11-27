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
  candles: Candle[];
  instrument: string;
  timeframe: string;
  setResult: (r: AnalyzeResponse | null) => void;
  setCandles: (c: Candle[], instrument: string, timeframe: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  result: null,
  candles: [],
  instrument: 'FOREX',
  timeframe: '15m',
  setResult: (r) => set({ result: r }),
  setCandles: (candles, instrument, timeframe) =>
    set({ candles, instrument, timeframe }),
}));
