export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FLOWREX SIGNAL
 * ═══════════════════════════════════════════════════════════════
 * Unified signal format for all analysis sources
 */
export type SignalDirection = 'long' | 'short' | 'neutral';
export type SignalGrade = 'A' | 'B' | 'C';

export interface FlowrexSignal {
  // Core signal properties
  direction: SignalDirection;
  confidence: number; // 0–100
  grade: SignalGrade; // A = high quality, B = medium, C = low

  // Context
  timeframe: string;
  instrument: string;
  symbol?: string;

  // Playbook info
  playbook: string; // Primary playbook (e.g., "NBB", "Tori")
  primaryPlaybook: string;
  backupPlaybook?: string;

  // Signal reasoning
  reasons: string[]; // Short bullet list of why this signal was generated
  riskHints: string[]; // Warnings/cautions (ADR stretched, late session, etc.)

  // Metadata
  createdAt: string;
}

export interface AnalyzeResponse {
  id: string;
  timestamp: string;
  context: any;
  classification: any;
  signal?: FlowrexSignal; // ⚡ NEW: Unified Flowrex signal
  tradePlan: any;
}
