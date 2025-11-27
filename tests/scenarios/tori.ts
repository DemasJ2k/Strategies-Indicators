import { RawMarketData } from '@agent/context';

/**
 * ═══════════════════════════════════════════════════════════════
 * TORI PLAYBOOK - MOCK SCENARIO
 * ═══════════════════════════════════════════════════════════════
 * This scenario should trigger the Tori (Trendline) playbook.
 *
 * Conditions:
 *   ✓ Clear ascending trendline (3+ touches)
 *   ✓ HTF trend aligned (bullish)
 *   ✓ Trendline respected (no break)
 *   ✓ Clean market structure
 *   ✓ Optimal session (London/NY)
 */

export const mockScenarioTori: RawMarketData = {
  candles: [
    // Establishing ascending trendline with higher lows
    { open: 4200, high: 4220, low: 4190, close: 4215, volume: 800000 }, // Low: 4190 (Touch 1)
    { open: 4215, high: 4240, low: 4210, close: 4235, volume: 850000 }, // Higher high
    { open: 4235, high: 4250, low: 4225, close: 4245, volume: 900000 }, // Low: 4225 (Touch 2)
    { open: 4245, high: 4270, low: 4240, close: 4265, volume: 920000 }, // Higher high

    // Third touch of trendline (around 4255-4260)
    { open: 4265, high: 4275, low: 4255, close: 4260, volume: 750000 }, // Low: 4255 (Touch 3)

    // Bounce from trendline (respect)
    { open: 4260, high: 4280, low: 4258, close: 4275, volume: 950000 }, // Bounce
    { open: 4275, high: 4295, low: 4270, close: 4290, volume: 1000000 }, // Continuation

    // Current price - above trendline, showing respect
    { open: 4290, high: 4305, low: 4285, close: 4300, volume: 1100000 },
    { open: 4300, high: 4315, low: 4295, close: 4310, volume: 1050000 },
  ],
  previousDayHigh: 4320.0,
  previousDayLow: 4180.0,
};

/**
 * Expected Result:
 * - Playbook: Tori (Trendline)
 * - Direction: LONG
 * - Confidence: 80-90%
 * - Context: Trendline respected, clean structure, bullish alignment
 */
