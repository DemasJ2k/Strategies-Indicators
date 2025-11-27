import { create } from 'zustand';
import { AnalyzeResponse } from '../lib/types';

interface AgentState {
  result: AnalyzeResponse | null;
  setResult: (r: AnalyzeResponse | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  result: null,
  setResult: (r) => set({ result: r }),
}));
