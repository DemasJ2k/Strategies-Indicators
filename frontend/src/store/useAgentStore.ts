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

interface PlaybookSettings {
  NBB: { enabled: boolean; adrMaxPct: number };
  TORI: { enabled: boolean; minTouches: number };
  FABIO: { enabled: boolean; imbalanceThreshold: number };
  JADE: { enabled: boolean; intradayStartHour: number; intradayEndHour: number };
}

interface RiskSettings {
  riskPercent: number;
  maxDailyTrades: number;
  rrTargets: number[];
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

  settings: PlaybookSettings;
  risk: RiskSettings;

  loading: boolean;
  error: string | null;

  setResult: (r: AnalyzeResponse | null) => void;
  setExecutionCandles: (c: Candle[], instrument: string, timeframe: string) => void;
  setHTFCandles: (c: Candle[]) => void;
  setCandles4H: (c: Candle[]) => void;

  setSettings: (s: Partial<PlaybookSettings>) => void;
  setRisk: (r: Partial<RiskSettings>) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  result: null,
  candles: [],
  htfCandles: [],
  candles4H: [],
  instrument: 'FOREX',
  timeframe: '15m',

  settings: {
    NBB: { enabled: true, adrMaxPct: 1.2 },
    TORI: { enabled: true, minTouches: 2 },
    FABIO: { enabled: true, imbalanceThreshold: 0.002 },
    JADE: { enabled: true, intradayStartHour: 9, intradayEndHour: 11 },
  },

  risk: {
    riskPercent: 1,
    maxDailyTrades: 3,
    rrTargets: [1, 2, 4],
  },

  loading: false,
  error: null,

  setResult: (r) => set({ result: r }),
  setExecutionCandles: (candles, instrument, timeframe) =>
    set({ candles, instrument, timeframe }),
  setHTFCandles: (htfCandles) => set({ htfCandles }),
  setCandles4H: (candles4H) => set({ candles4H }),

  setSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),

  setRisk: (r) =>
    set((state) => ({ risk: { ...state.risk, ...r } })),

  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e }),
}));
