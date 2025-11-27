import { MarketData } from '@custom-types/market';
import { ClassifierResult } from '@custom-types/playbook';
import { classifyMarket } from '@agent/classifier';
import { logger } from '@utils/logger';

/**
 * Main Agent Controller
 * Orchestrates the market analysis and playbook selection
 */
export class MarketPlaybookAgent {
  /**
   * Run the agent with current market data
   */
  async run(marketData: MarketData): Promise<ClassifierResult> {
    logger.info('🚀 Market Playbook Agent Starting...');
    logger.info('📊 Market Data Received', {
      price: marketData.price,
      htfTrend: marketData.htfTrend,
      session: marketData.session,
    });

    // Run the classifier
    const result = classifyMarket(marketData);

    // Log the result
    if (result.playbook) {
      logger.success(`✅ Playbook Selected: ${result.playbook.name}`);
      logger.info('📋 Trade Plan:', {
        direction: result.playbook.direction,
        context: result.playbook.context,
        tpLogic: result.playbook.tpLogic,
        confidence: result.playbook.confidence,
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
  async fetchMarketData(): Promise<MarketData> {
    logger.info('📡 Fetching market data...');

    // TODO: Replace with real market data fetching
    const mockData: MarketData = {
      price: 4500.0,
      high: 4520.0,
      low: 4480.0,
      volume: 1000000,
      htfTrend: 'bullish',
      session: 'ny',
      liquidityZones: {
        high: [4520.0, 4530.0],
        low: [4480.0, 4470.0],
        swept: [{ level: 4480.0, direction: 'low' }],
      },
      trendline: {
        exists: true,
        touches: 3,
        respected: true,
      },
      balanceZones: {
        inBalance: false,
        lvnDetected: true,
      },
      volatility: 'high',
      previousDayHigh: 4515.0,
      previousDayLow: 4475.0,
    };

    return mockData;
  }
}
