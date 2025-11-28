import { OandaProvider } from './oanda';
import { FxcmProvider } from './fxcm';
import { BinanceProvider } from './binance';
import { BybitProvider } from './bybit';
import { DataProvider } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * UNIFIED DATA PROVIDER SELECTOR
 * ═══════════════════════════════════════════════════════════════
 * Central registry for all broker/exchange data providers
 */

export function getProvider(type: string): DataProvider | null {
  const providerType = type.toUpperCase();

  switch (providerType) {
    case 'OANDA':
      return OandaProvider;
    case 'FXCM':
      return FxcmProvider;
    case 'BINANCE':
      return BinanceProvider;
    case 'BYBIT':
      return BybitProvider;
    default:
      return null;
  }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): string[] {
  return ['OANDA', 'FXCM', 'BINANCE', 'BYBIT'];
}

// Re-export types for convenience
export type { Candle, DataProvider } from './types';
