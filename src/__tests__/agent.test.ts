import { MarketPlaybookAgent } from '@agent/agent';
import { RawMarketData } from '@custom-types/market';

const mockRawData: RawMarketData = {
  candles: [
    { open: 4480, high: 4490, low: 4475, close: 4485, volume: 800000 },
    { open: 4485, high: 4495, low: 4480, close: 4490, volume: 850000 },
    { open: 4490, high: 4500, low: 4485, close: 4495, volume: 900000 },
    { open: 4495, high: 4510, low: 4490, close: 4505, volume: 1200000 },
    { open: 4505, high: 4520, low: 4500, close: 4515, volume: 1500000 },
  ],
  previousDayHigh: 4515,
  previousDayLow: 4475,
};

describe('MarketPlaybookAgent', () => {
  it('builds market context and returns classifier output shape', async () => {
    const agent = new MarketPlaybookAgent();
    const result = await agent.run(mockRawData);

    expect(result).toHaveProperty('signal');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('timestamp');
  });
});
