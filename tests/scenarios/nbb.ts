import { RawMarketData } from '@agent/context';

/**
 * ═══════════════════════════════════════════════════════════════
 * NBB PLAYBOOK - MOCK SCENARIO
 * ═══════════════════════════════════════════════════════════════
 * This scenario should trigger the NBB playbook.
 *
 * Conditions:
 *   ✓ Bullish HTF trend (higher highs, higher lows)
 *   ✓ PO3 discount zone (price below 50% equilibrium)
 *   ✓ Liquidity sweep (swept previous low then reversed)
 *   ✓ Structure break (bullish breaker block)
 *   ✓ Volume spike with displacement
 *   ✓ OTE retrace (62-79% retracement)
 */

export const mockScenarioNBB: RawMarketData = {
  candles: [
    // Early candles establishing bullish trend
    { open: 4400, high: 4420, low: 4390, close: 4415, volume: 800000 },
    { open: 4415, high: 4440, low: 4410, close: 4435, volume: 850000 },
    { open: 4435, high: 4460, low: 4430, close: 4455, volume: 900000 },

    // Retracement to create OTE zone (this creates swing high at 4460)
    { open: 4455, high: 4465, low: 4440, close: 4445, volume: 700000 },
    { open: 4445, high: 4450, low: 4425, close: 4430, volume: 650000 },

    // Liquidity sweep: wick below previous low (4425) then reversal
    { open: 4430, high: 4435, low: 4418, close: 4428, volume: 750000 }, // Swept 4425

    // Structure break with volume spike (bullish breaker)
    { open: 4428, high: 4470, low: 4425, close: 4465, volume: 1500000 }, // Volume spike + displacement
    { open: 4465, high: 4480, low: 4460, close: 4475, volume: 1300000 }, // Continuation

    // Current candle - in discount zone, above OTE
    { open: 4475, high: 4490, low: 4470, close: 4485, volume: 1100000 },
  ],
  previousDayHigh: 4500.0,
  previousDayLow: 4380.0,
};

/**
 * Expected Result:
 * - Playbook: NBB
 * - Direction: LONG
 * - Confidence: 85-95%
 * - Context: All 6 validations passed
 */
