import { MarketContext } from '@custom-types/context';
import { detectTrend } from '@detectors/trend';
import { detectLiquidity } from '@detectors/liquidity';
import { detectSession } from '@detectors/session';
import { detectVolume } from '@detectors/volume';
import { detectTrendline } from '@detectors/trendline';
import { detectMMM, detectBreakerBlock, detectPO3Zone, detectOTELevel } from '@detectors/nbb';
import { logger } from '@utils/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * MARKET CONTEXT BUILDER
 * ═══════════════════════════════════════════════════════════════
 * Builds MarketContext from raw market data by running all detectors.
 *
 * This is the glue between raw price data and the agent.
 */

/**
 * Raw Market Data Interface
 * This is what you'd receive from your data source
 */
export interface RawMarketData {
  candles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time?: number;
  }>;
  previousDayHigh: number;
  previousDayLow: number;
}

/**
 * Build Market Context
 *
 * Takes raw market data and runs all detectors to build a complete MarketContext.
 * This is the SINGLE place where all detectors are called.
 *
 * @param rawData - Raw market data from your data source
 * @returns Complete MarketContext ready for the agent
 */
export function buildMarketContext(rawData: RawMarketData): MarketContext {
  logger.info('\n════════════════════════════════════════════');
  logger.info('🔧 BUILDING MARKET CONTEXT FROM RAW DATA');
  logger.info('════════════════════════════════════════════\n');

  if (!rawData.candles || rawData.candles.length === 0) {
    throw new Error('No candle data provided');
  }

  const currentCandle = rawData.candles[rawData.candles.length - 1];

  // ─────────────────────────────────────────────────────────────
  // Run all detectors
  // ─────────────────────────────────────────────────────────────

  logger.info('Running detectors...\n');

  // 1. Detect HTF Trend
  const trendResult = detectTrend(rawData.candles);

  // 2. Detect Liquidity Zones and Sweeps
  const liquidityResult = detectLiquidity(
    rawData.candles,
    rawData.previousDayHigh,
    rawData.previousDayLow
  );

  // 3. Detect Current Session
  const sessionResult = detectSession();

  // 4. Detect Volume Profile
  const volumeResult = detectVolume(rawData.candles);

  // 5. Detect Trendlines
  const trendlineResult = detectTrendline(rawData.candles, trendResult.htfTrend);

  // ─────────────────────────────────────────────────────────────
  // NBB-Specific Detectors
  // ─────────────────────────────────────────────────────────────

  logger.info('\nRunning NBB-specific detectors...\n');

  // 6. Detect Market Maker Model (MMM)
  const mmmResult = detectMMM(rawData.candles);

  // 7. Detect Breaker Blocks
  const breakerResult = detectBreakerBlock(rawData.candles);

  // 8. Detect PO3 Zones (Premium/Discount)
  const po3Result = detectPO3Zone(rawData.candles, trendResult.htfTrend);

  // 9. Detect OTE Levels
  const oteResult = detectOTELevel(rawData.candles, trendResult.htfTrend);

  // ─────────────────────────────────────────────────────────────
  // Build MarketContext from detector results
  // ─────────────────────────────────────────────────────────────

  logger.info('\n📦 Assembling MarketContext...\n');

  // Determine if liquidity was swept
  const liquiditySweep = liquidityResult.swept.length > 0;
  const sweptDirection = liquiditySweep ? liquidityResult.swept[0].direction : null;

  // Determine if structure break occurred - use breaker block detection
  const structureBreak = breakerResult.exists || (volumeResult.spike && volumeResult.displacement);
  const breakDirection = breakerResult.exists
    ? breakerResult.type
    : structureBreak
    ? trendResult.htfTrend === 'bullish'
      ? 'bullish'
      : trendResult.htfTrend === 'bearish'
      ? 'bearish'
      : null
    : null;

  // Use real PO3 zone detection
  const po3ZonePresent = po3Result.exists;
  const priceAtPO3 = po3Result.inPremium || po3Result.inDiscount;

  // Use real OTE level detection
  const oteRetrace = oteResult.available;
  const oteLevel = oteResult.level;

  // Build liquidity zones array
  const liquidityZones = [
    ...liquidityResult.zones.high.map((level) => ({ level, type: 'high' as const, swept: false })),
    ...liquidityResult.zones.low.map((level) => ({ level, type: 'low' as const, swept: false })),
  ];

  // Mark swept zones
  for (const swept of liquidityResult.swept) {
    const zone = liquidityZones.find((z) => z.level === swept.level && z.type === swept.direction);
    if (zone) {
      zone.swept = true;
    }
  }

  // Determine volatility (simplified - based on volume spike)
  const volatility = volumeResult.spike ? 'high' : 'low';

  const context: MarketContext = {
    // Session
    session: sessionResult.current,

    // HTF Trend
    htfTrend: trendResult.htfTrend,

    // Current Price Data
    price: currentCandle.close,
    high: currentCandle.high,
    low: currentCandle.low,
    volume: currentCandle.volume,

    // PO3 Zone
    po3ZonePresent,
    priceAtPO3,

    // Liquidity
    liquiditySweep,
    sweptDirection,
    liquidityZones,

    // Structure
    structureBreak,
    breakDirection,

    // Volume
    volumeSpike: volumeResult.spike,
    displacement: volumeResult.displacement,

    // OTE
    oteRetrace,
    oteLevel,

    // Trendline
    trendline: {
      exists: trendlineResult.exists,
      touches: trendlineResult.touches,
      respected: trendlineResult.respected,
    },

    // Balance Zones
    balanceZones: {
      inBalance: !volumeResult.displacement, // Simplified
      lvnDetected: !volumeResult.spike, // Simplified - LVN when no volume spike
    },

    // Volatility
    volatility,

    // Previous Day Levels
    previousDayHigh: rawData.previousDayHigh,
    previousDayLow: rawData.previousDayLow,
  };

  logger.success('✓ MarketContext built successfully\n');
  logger.info('════════════════════════════════════════════');
  logger.info('📊 CONTEXT SUMMARY');
  logger.info('════════════════════════════════════════════');
  logger.info(`  HTF Trend: ${context.htfTrend.toUpperCase()}`);
  logger.info(`  Session: ${context.session.toUpperCase()}`);
  logger.info(`  Price: ${context.price}`);
  logger.info('  ────────────────────────────────────────');
  logger.info(`  Volume Spike: ${context.volumeSpike ? 'YES' : 'NO'}`);
  logger.info(`  Displacement: ${context.displacement ? 'YES' : 'NO'}`);
  logger.info(`  Liquidity Sweep: ${context.liquiditySweep ? 'YES (' + context.sweptDirection + ')' : 'NO'}`);
  logger.info(`  Structure Break: ${context.structureBreak ? 'YES (' + context.breakDirection + ')' : 'NO'}`);
  logger.info('  ────────────────────────────────────────');
  logger.info(`  MMM Phase: ${mmmResult.phase.toUpperCase()}`);
  logger.info(`  Breaker Block: ${breakerResult.exists ? 'YES (' + breakerResult.type + ')' : 'NO'}`);
  logger.info(`  PO3 Zone: ${po3Result.exists ? (po3Result.inPremium ? 'PREMIUM' : 'DISCOUNT') : 'NONE'}`);
  logger.info(`  OTE Level: ${oteResult.available ? oteResult.level : 'NOT AVAILABLE'}`);
  logger.info('  ────────────────────────────────────────');
  logger.info(`  Trendline: ${context.trendline.exists ? `${context.trendline.touches} touches` : 'NONE'}`);
  logger.info('════════════════════════════════════════════\n');

  return context;
}
