import { classifyMarket } from '@agent/classifier';
import { buildMarketContext, RawMarketData } from '@agent/context';
import { ClassifierOutput } from '@custom-types/context';
import { createLogger } from '@utils/agent_logger';

const logger = createLogger('Agent');

/**
 * Main Agent Controller
 * Orchestrates the market analysis and playbook selection
 */
export class MarketPlaybookAgent {
  /**
   * Run the agent with current market data
   */
  async run(rawData: RawMarketData): Promise<ClassifierOutput> {
    logger.info('🚀 Market Playbook Agent Starting...');
    logger.info('📊 Market Data Received', {
      candles: rawData.candles.length,
      previousDayHigh: rawData.previousDayHigh,
      previousDayLow: rawData.previousDayLow,
    });

    // Build normalized market context before classification
    const marketContext = buildMarketContext(rawData);

    // Run the classifier
    const result = classifyMarket(marketContext);

    // Log the result
    if (result.signal) {
      logger.success(`✅ Playbook Selected: ${result.signal.playbookName}`);
      logger.info('📋 Trade Plan:', {
        direction: result.signal.direction,
        context: result.signal.context,
        tpLogic: result.signal.tpLogic,
        confidence: result.signal.confidence,
      });
    } else {
      logger.warn('⚠️ No playbook activated - Market conditions not met');
    }

    return result;
  }

  /**
   * Fetch market data (placeholder for now)
   * In production, this would connect to your data source
   */
  async fetchMarketData(): Promise<RawMarketData> {
    logger.info('📡 Fetching market data...');

    // TODO: Replace with real market data fetching
    const mockData: RawMarketData = {
      candles: [
        { open: 4480, high: 4490, low: 4475, close: 4485, volume: 800000 },
        { open: 4485, high: 4495, low: 4480, close: 4490, volume: 850000 },
        { open: 4490, high: 4500, low: 4485, close: 4495, volume: 900000 },
        { open: 4495, high: 4510, low: 4490, close: 4505, volume: 1200000 },
        { open: 4505, high: 4520, low: 4500, close: 4515, volume: 1500000 },
      ],
      previousDayHigh: 4515.0,
      previousDayLow: 4475.0,
    };

    return mockData;
  }
}
