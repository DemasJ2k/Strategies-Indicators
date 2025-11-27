import fs from 'fs';
import { Candle } from '@custom-types/candle';

/**
 * ═══════════════════════════════════════════════════════════════
 * CSV CANDLE LOADER
 * ═══════════════════════════════════════════════════════════════
 * Loads OHLCV candle data from CSV files.
 *
 * Supports:
 * - Custom column mappings
 * - Custom delimiters (comma, tab, semicolon)
 * - Headers or no headers
 *
 * Data Sources:
 * - Alpaca, IEX Cloud, TradingView exports
 * - Quandl, Yahoo Finance
 * - Bybit, Binance exports
 * - Custom broker data
 */

export interface CSVConfig {
  delimiter?: string; // Default: ','
  timeColumn?: string; // Default: 'time'
  openColumn?: string; // Default: 'open'
  highColumn?: string; // Default: 'high'
  lowColumn?: string; // Default: 'low'
  closeColumn?: string; // Default: 'close'
  volumeColumn?: string; // Default: 'volume'
  hasHeader?: boolean; // Default: true
}

/**
 * Load candles from CSV file
 *
 * @param filePath - Path to CSV file (absolute or relative)
 * @param config - Optional configuration for column mapping
 * @returns Promise<Candle[]> - Array of candles
 *
 * @example
 * ```typescript
 * // Basic usage (assumes standard column names)
 * const candles = await loadCandlesFromCSV('./data/es_futures.csv');
 *
 * // Custom column mapping
 * const candles = await loadCandlesFromCSV('./data/custom.csv', {
 *   timeColumn: 'timestamp',
 *   openColumn: 'o',
 *   highColumn: 'h',
 *   lowColumn: 'l',
 *   closeColumn: 'c',
 *   delimiter: ';'
 * });
 * ```
 */
export async function loadCandlesFromCSV(
  filePath: string,
  config?: CSVConfig
): Promise<Candle[]> {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length === 0) {
    throw new Error(`CSV file is empty: ${filePath}`);
  }

  // Configuration defaults
  const delimiter = config?.delimiter || ',';
  const hasHeader = config?.hasHeader !== false; // Default true
  const timeCol = config?.timeColumn || 'time';
  const openCol = config?.openColumn || 'open';
  const highCol = config?.highColumn || 'high';
  const lowCol = config?.lowColumn || 'low';
  const closeCol = config?.closeColumn || 'close';
  const volumeCol = config?.volumeColumn || 'volume';

  // Parse header to find column indices
  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

  const timeIdx = headers.indexOf(timeCol.toLowerCase());
  const openIdx = headers.indexOf(openCol.toLowerCase());
  const highIdx = headers.indexOf(highCol.toLowerCase());
  const lowIdx = headers.indexOf(lowCol.toLowerCase());
  const closeIdx = headers.indexOf(closeCol.toLowerCase());
  const volumeIdx = headers.indexOf(volumeCol.toLowerCase());

  // Validate required columns exist
  if (timeIdx === -1) {
    throw new Error(`Time column '${timeCol}' not found in CSV. Available columns: ${headers.join(', ')}`);
  }
  if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
    throw new Error(
      `Required OHLC columns not found. Available columns: ${headers.join(', ')}`
    );
  }

  // Parse candles
  const candles: Candle[] = [];
  const startLine = hasHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(delimiter).map((v) => v.trim());

    // Parse values
    const time = parseInt(values[timeIdx]);
    const open = parseFloat(values[openIdx]);
    const high = parseFloat(values[highIdx]);
    const low = parseFloat(values[lowIdx]);
    const close = parseFloat(values[closeIdx]);
    const volume = volumeIdx >= 0 && values[volumeIdx] ? parseFloat(values[volumeIdx]) : undefined;

    // Validate parsed values
    if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.warn(`Skipping invalid row ${i}: ${line}`);
      continue;
    }

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  if (candles.length === 0) {
    throw new Error(`No valid candles found in CSV: ${filePath}`);
  }

  console.log(`✓ Loaded ${candles.length} candles from ${filePath}`);

  return candles;
}

/**
 * Load candles from CSV string (for testing or API responses)
 */
export function loadCandlesFromCSVString(csvContent: string, config?: CSVConfig): Candle[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length === 0) {
    throw new Error('CSV content is empty');
  }

  // Same logic as loadCandlesFromCSV but using csvContent instead of reading file
  const delimiter = config?.delimiter || ',';
  const hasHeader = config?.hasHeader !== false;
  const timeCol = config?.timeColumn || 'time';
  const openCol = config?.openColumn || 'open';
  const highCol = config?.highColumn || 'high';
  const lowCol = config?.lowColumn || 'low';
  const closeCol = config?.closeColumn || 'close';
  const volumeCol = config?.volumeColumn || 'volume';

  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

  const timeIdx = headers.indexOf(timeCol.toLowerCase());
  const openIdx = headers.indexOf(openCol.toLowerCase());
  const highIdx = headers.indexOf(highCol.toLowerCase());
  const lowIdx = headers.indexOf(lowCol.toLowerCase());
  const closeIdx = headers.indexOf(closeCol.toLowerCase());
  const volumeIdx = headers.indexOf(volumeCol.toLowerCase());

  if (timeIdx === -1 || openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
    throw new Error('Required columns not found in CSV');
  }

  const candles: Candle[] = [];
  const startLine = hasHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(delimiter).map((v) => v.trim());

    const time = parseInt(values[timeIdx]);
    const open = parseFloat(values[openIdx]);
    const high = parseFloat(values[highIdx]);
    const low = parseFloat(values[lowIdx]);
    const close = parseFloat(values[closeIdx]);
    const volume = volumeIdx >= 0 && values[volumeIdx] ? parseFloat(values[volumeIdx]) : undefined;

    if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      continue;
    }

    candles.push({ time, open, high, low, close, volume });
  }

  return candles;
}
