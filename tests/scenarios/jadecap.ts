import { RawMarketData } from '@agent/context';

/**
 * ═══════════════════════════════════════════════════════════════
 * JADECAP PLAYBOOK - MOCK SCENARIO
 * ═══════════════════════════════════════════════════════════════
 * This scenario should trigger the JadeCap (Liquidity Model) playbook.
 *
 * Conditions:
 *   ✓ Session sweep (Asian/London high or low)
 *   ✓ NY session active (13:00-22:00 UTC)
 *   ✓ Liquidity grab with reversal
 *   ✓ Clear directional bias after sweep
 *
 * NOTE: This scenario simulates NY session trading where Asian session
 * high is swept and then price reverses for a short opportunity.
 */

export const mockScenarioJadeCap: RawMarketData = {
  candles: [
    // Asian session range (simulate Asian high at 4730)
    { open: 4700, high: 4730, low: 4690, close: 4720, volume: 600000 }, // Asian high: 4730
    { open: 4720, high: 4728, low: 4710, close: 4715, volume: 580000 },

    // London session - testing Asian high
    { open: 4715, high: 4735, low: 4710, close: 4725, volume: 750000 }, // Tested 4730

    // NY session - SWEEP Asian high then REVERSAL
    { open: 4725, high: 4740, low: 4720, close: 4722, volume: 1200000 }, // Swept 4730, closed below

    // Strong reversal after sweep (liquidity grab complete)
    { open: 4722, high: 4725, low: 4690, close: 4695, volume: 1800000 }, // Volume spike + displacement down
    { open: 4695, high: 4700, low: 4680, close: 4685, volume: 1600000 }, // Continuation

    // Current price - after successful sweep and reversal
    { open: 4685, high: 4692, low: 4675, close: 4680, volume: 1400000 },
  ],
  previousDayHigh: 4750.0,
  previousDayLow: 4670.0,
};

/**
 * Expected Result:
 * - Playbook: JadeCap (Liquidity Model)
 * - Direction: SHORT
 * - Confidence: 80-90%
 * - Context: Asian high swept during NY session, strong reversal
 *
 * Session Sweep Details:
 * - Asian High: 4730
 * - Sweep Candle: High 4740 (swept), Close 4722 (below)
 * - Direction: Bearish (swept high → sell)
 */
