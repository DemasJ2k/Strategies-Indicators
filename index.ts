import { MarketPlaybookAgent } from '@agent/agent';
import { logger } from '@utils/logger';

/**
 * Main Entry Point
 * Starts the Market Playbook Agent
 */
async function main() {
  try {
    logger.info('═══════════════════════════════════════════');
    logger.info('🤖 MARKET PLAYBOOK AGENT - VERSION 1');
    logger.info('═══════════════════════════════════════════\n');

    const agent = new MarketPlaybookAgent();

    // Fetch current market data
    const marketData = await agent.fetchMarketData();

    // Run the agent
    const result = await agent.run(marketData);

    logger.info('\n═══════════════════════════════════════════');
    logger.info('Agent execution completed');
    logger.info('═══════════════════════════════════════════');
  } catch (error) {
    logger.error('Fatal error in agent execution:', error);
    process.exit(1);
  }
}

// Run the agent
main();
