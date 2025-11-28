import { listRecentSignals, listRecentTrades } from '../journal/journalQueries';

export interface AssistantContextOptions {
  includeSignals?: boolean;
  includeTrades?: boolean;
  includePortfolio?: boolean;
  userId?: string;
}

/**
 * Build comprehensive context for AI assistant from various data sources
 */
export async function buildAssistantContext(
  opts: AssistantContextOptions,
  latestAnalysis?: any
) {
  const context: any = {};

  // Include latest analysis if provided
  if (latestAnalysis) {
    context.latestAnalysis = {
      signal: latestAnalysis.signal,
      tradePlan: latestAnalysis.tradePlan,
      playbook: latestAnalysis.tradePlan?.playbook,
      contextFlags: {
        htfBias: latestAnalysis.context?.htfBias,
        session: latestAnalysis.context?.session,
        hasMMMStructure: latestAnalysis.context?.hasMMMStructure,
        hasSessionLiquidityRaid: latestAnalysis.context?.hasSessionLiquidityRaid,
        hasIntradayConfirmationPattern:
          latestAnalysis.context?.hasIntradayConfirmationPattern,
      },
    };
  }

  // Include recent signals from database
  if (opts.includeSignals) {
    context.recentSignals = await listRecentSignals(20, opts.userId);
  }

  // Include recent trades from database
  if (opts.includeTrades) {
    context.recentTrades = await listRecentTrades(20, opts.userId);
  }

  // Portfolio placeholder - will be enhanced with real data
  if (opts.includePortfolio) {
    context.portfolio = {
      note: 'Portfolio data should be supplied by caller in future iterations.',
    };
  }

  return context;
}
