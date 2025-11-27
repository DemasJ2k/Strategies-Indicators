export interface PlaybookOutput {
  name: string;
  direction: 'bullish' | 'bearish';
  context: string;
  tpLogic: string;
  session: string;
  confidence: number;
}

export interface ClassifierResult {
  playbook: PlaybookOutput | null;
  priority: number;
  timestamp: Date;
}
