import { VolumeProfile } from '@custom-types/detector';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * VOLUME PROFILE DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Analyzes volume patterns and spikes.
 *
 * Detects:
 *   - Volume spikes (unusually high volume)
 *   - Displacement (strong directional move with volume)
 *   - Volume trends
 */

interface VolumeData {
  volume: number;
  high: number;
  low: number;
  close: number;
  open: number;
}

/**
 * Detect Volume Profile
 * @param data - Array of volume data
 * @returns VolumeProfile with volume metrics
 */
export function detectVolume(data: VolumeData[]): VolumeProfile {
  logger.info('  📊 Analyzing Volume Profile...');

  if (!data || data.length < 2) {
    logger.warn('  ⚠ Insufficient data for volume analysis');
    return {
      total: 0,
      spike: false,
      displacement: false,
    };
  }

  const currentCandle = data[data.length - 1];
  const total = currentCandle.volume;

  // Calculate average volume (last 10 candles)
  const avgVolume = calculateAverageVolume(data);

  // Detect volume spike (current volume > 1.5x average)
  const spike = total > avgVolume * 1.5;

  // Detect displacement (large price move with high volume)
  const displacement = detectDisplacement(currentCandle, avgVolume);

  if (spike && displacement) {
    logger.success('  ✓ Volume Spike + Displacement detected');
  } else if (spike) {
    logger.info('  → Volume Spike detected (no displacement)');
  } else {
    logger.info('  → Normal volume, no spike');
  }

  return {
    total,
    spike,
    displacement,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate average volume over recent candles
 */
function calculateAverageVolume(data: VolumeData[]): number {
  const lookback = Math.min(10, data.length - 1);
  const recentData = data.slice(-lookback - 1, -1); // Exclude current candle

  const sum = recentData.reduce((acc, candle) => acc + candle.volume, 0);
  return sum / recentData.length;
}

/**
 * Detect displacement (strong directional move)
 * Criteria:
 *   - Large candle body (close far from open)
 *   - High volume
 *   - Small wicks (price moved with conviction)
 */
function detectDisplacement(candle: VolumeData, avgVolume: number): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const candleRange = candle.high - candle.low;

  // Body should be at least 70% of candle range (small wicks)
  const bodyRatio = bodySize / candleRange;

  // Volume should be elevated
  const hasHighVolume = candle.volume > avgVolume;

  // Displacement if strong body and high volume
  return bodyRatio >= 0.7 && hasHighVolume;
}

/**
 * Analyze volume trend (increasing or decreasing)
 */
export function analyzeVolumeTrend(data: VolumeData[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 3) {
    return 'stable';
  }

  const recent3 = data.slice(-3);
  const volumes = recent3.map((c) => c.volume);

  // Check if consistently increasing
  if (volumes[1] > volumes[0] && volumes[2] > volumes[1]) {
    return 'increasing';
  }

  // Check if consistently decreasing
  if (volumes[1] < volumes[0] && volumes[2] < volumes[1]) {
    return 'decreasing';
  }

  return 'stable';
}
