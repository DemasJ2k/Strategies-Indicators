import { RawMarketData } from '@agent/context';

/**
 * ═══════════════════════════════════════════════════════════════
 * FABIO PLAYBOOK - MOCK SCENARIO
 * ═══════════════════════════════════════════════════════════════
 * This scenario should trigger the Fabio (Auction Market) playbook.
 *
 * Conditions:
 *   ✓ Balance zone detected (consolidation/ranging)
 *   ✓ Imbalance transition (gap/jump out of balance)
 *   ✓ Volume spike confirming auction shift
 *   ✓ Clean directional move
 */

export const mockScenarioFabio: RawMarketData = {
  candles: [
    // Balance zone - tight consolidation (small bodies, overlapping ranges)
    { open: 4600, high: 4615, low: 4595, close: 4605, volume: 700000 },
    { open: 4605, high: 4620, low: 4600, close: 4610, volume: 680000 },
    { open: 4610, high: 4618, low: 4598, close: 4602, volume: 650000 },
    { open: 4602, high: 4616, low: 4597, close: 4608, volume: 670000 },
    { open: 4608, high: 4622, low: 4603, close: 4606, volume: 660000 },
    { open: 4606, high: 4619, low: 4601, close: 4612, volume: 640000 },

    // Imbalance - GAP UP (current.low > previous.high)
    // Previous high: 4619, this candle low: 4625 → GAP!
    { open: 4625, high: 4650, low: 4625, close: 4645, volume: 1800000 }, // Volume spike + gap

    // Continuation after imbalance
    { open: 4645, high: 4665, low: 4640, close: 4660, volume: 1500000 },
    { open: 4660, high: 4680, low: 4655, close: 4675, volume: 1400000 },
  ],
  previousDayHigh: 4630.0,
  previousDayLow: 4580.0,
};

/**
 * Expected Result:
 * - Playbook: Fabio (Auction Market)
 * - Direction: LONG
 * - Confidence: 75-85%
 * - Context: Balance → Imbalance transition with volume confirmation
 */
