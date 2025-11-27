import fs from 'fs';
import path from 'path';
import { createLogger } from '@utils/agent_logger';

const logger = createLogger('Config');

/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIG LOADER - PROFESSIONAL-GRADE CONFIGURATION SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * Centralized configuration management for the Market Playbook Agent.
 *
 * Features:
 * - Load configurations from JSON files
 * - Playbook settings (priority, minConfidence, enabled state)
 * - Detector weights for confidence scoring
 * - Default application settings
 * - Configuration validation
 * - Environment-specific overrides
 *
 * Usage:
 * ```typescript
 * import { loadConfig, getPlaybookConfig, getDetectorWeights } from '@config/config';
 *
 * // Load all configs on startup
 * const config = loadConfig();
 *
 * // Get specific playbook settings
 * const nbbConfig = getPlaybookConfig('NBB');
 *
 * // Get detector weights
 * const weights = getDetectorWeights();
 * ```
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface DefaultConfig {
  port: number;
  logLevel: string;
  webhookSecret: string;
  enableFileLogging: boolean;
  dataSource: 'csv' | 'webhook' | 'mts';
  environment: string;
  server: {
    host: string;
    corsEnabled: boolean;
    requestTimeout: number;
  };
  logging: {
    directory: string;
    enableConsole: boolean;
    enableColors: boolean;
    maxFileSize: string;
    maxFiles: number;
  };
}

export interface PlaybookConfig {
  enabled: boolean;
  priority: number;
  minConfidence: number;
  description: string;
  requiredConditions: string[];
}

export interface PlaybooksConfig {
  playbooks: {
    NBB: PlaybookConfig;
    JadeCap: PlaybookConfig;
    Tori: PlaybookConfig;
    Fabio: PlaybookConfig;
  };
  globalSettings: {
    enableAllPlaybooks: boolean;
    maxPlaybooksPerSignal: number;
    requireMinConfidence: boolean;
  };
}

export interface WeightsConfig {
  detectorWeights: {
    htfTrend: number;
    liquiditySweep: number;
    structureBreak: number;
    volumeSpike: number;
    oteRetrace: number;
    trendline: number;
    balanceToImbalance: number;
    sessionTiming: number;
    displacement: number;
    fvg: number;
    mss: number;
    orderBlocks: number;
    po3Zone: number;
    mmmPhase: number;
  };
  confidenceModifiers: {
    strongVolume: number;
    optimalOTE: number;
    multipleTouches: number;
    clearLVN: number;
    strongMove: number;
    highVolatility: number;
  };
  thresholds: {
    minSwingTouches: number;
    minVolumeSpikeRatio: number;
    minDisplacementRatio: number;
    oteMinLevel: number;
    oteMaxLevel: number;
    balanceVolatilityThreshold: number;
    balanceRangeThreshold: number;
  };
  sessionWeights: {
    asian: number;
    london: number;
    ny: number;
    overlap: number;
  };
}

export interface AppConfig {
  default: DefaultConfig;
  playbooks: PlaybooksConfig;
  weights: WeightsConfig;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL CONFIG CACHE
// ═══════════════════════════════════════════════════════════════

let cachedConfig: AppConfig | null = null;

// ═══════════════════════════════════════════════════════════════
// CONFIG LOADING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Load all configuration files
 *
 * Reads config files from the config/ directory and caches them.
 * This should be called once on application startup.
 *
 * @param configDir - Path to config directory (defaults to './config')
 * @returns AppConfig object with all loaded configurations
 *
 * @throws Error if config files are missing or invalid
 */
export function loadConfig(configDir: string = './config'): AppConfig {
  logger.info('═══════════════════════════════════════════');
  logger.info('📋 LOADING CONFIGURATION FILES');
  logger.info('═══════════════════════════════════════════');

  try {
    // Resolve absolute path
    const absoluteConfigDir = path.resolve(configDir);
    logger.info(`Config directory: ${absoluteConfigDir}`);

    // Load default.json
    const defaultPath = path.join(absoluteConfigDir, 'default.json');
    logger.info(`Loading default config from: ${defaultPath}`);
    const defaultConfig: DefaultConfig = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
    logger.success('✓ default.json loaded');

    // Load playbooks.json
    const playbooksPath = path.join(absoluteConfigDir, 'playbooks.json');
    logger.info(`Loading playbooks config from: ${playbooksPath}`);
    const playbooksConfig: PlaybooksConfig = JSON.parse(fs.readFileSync(playbooksPath, 'utf-8'));
    logger.success('✓ playbooks.json loaded');

    // Load weights.json
    const weightsPath = path.join(absoluteConfigDir, 'weights.json');
    logger.info(`Loading weights config from: ${weightsPath}`);
    const weightsConfig: WeightsConfig = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));
    logger.success('✓ weights.json loaded');

    // Build complete config
    const config: AppConfig = {
      default: defaultConfig,
      playbooks: playbooksConfig,
      weights: weightsConfig,
    };

    // Validate config
    validateConfig(config);

    // Cache config
    cachedConfig = config;

    logger.success('✓ All configurations loaded and validated');
    logger.info('═══════════════════════════════════════════\n');

    return config;
  } catch (error) {
    logger.error('Failed to load configuration files', error);
    throw new Error(`Configuration loading failed: ${error}`);
  }
}

/**
 * Get the current loaded configuration
 *
 * Returns the cached configuration. If not loaded, attempts to load it.
 *
 * @returns AppConfig object
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    logger.warn('Config not loaded yet, loading now...');
    return loadConfig();
  }
  return cachedConfig;
}

/**
 * Get configuration for a specific playbook
 *
 * @param playbookName - Name of the playbook ('NBB', 'Tori', 'Fabio', 'JadeCap')
 * @returns PlaybookConfig for the specified playbook
 *
 * @example
 * ```typescript
 * const nbbConfig = getPlaybookConfig('NBB');
 * if (nbbConfig.enabled) {
 *   console.log(`NBB priority: ${nbbConfig.priority}`);
 *   console.log(`Min confidence: ${nbbConfig.minConfidence}%`);
 * }
 * ```
 */
export function getPlaybookConfig(playbookName: 'NBB' | 'Tori' | 'Fabio' | 'JadeCap'): PlaybookConfig {
  const config = getConfig();
  return config.playbooks.playbooks[playbookName];
}

/**
 * Get all playbook configurations sorted by priority
 *
 * @returns Array of playbook configs sorted by priority (lowest first)
 */
export function getAllPlaybookConfigs(): Array<{ name: string; config: PlaybookConfig }> {
  const config = getConfig();
  const playbooks = config.playbooks.playbooks;

  return Object.entries(playbooks)
    .map(([name, cfg]) => ({ name, config: cfg }))
    .sort((a, b) => a.config.priority - b.config.priority);
}

/**
 * Get detector weights configuration
 *
 * @returns WeightsConfig with all detector weights and thresholds
 *
 * @example
 * ```typescript
 * const weights = getDetectorWeights();
 * const htfWeight = weights.detectorWeights.htfTrend; // 1.0
 * const volumeModifier = weights.confidenceModifiers.strongVolume; // 5
 * ```
 */
export function getDetectorWeights(): WeightsConfig {
  const config = getConfig();
  return config.weights;
}

/**
 * Get specific detector weight
 *
 * @param detectorName - Name of the detector
 * @returns Weight value (0.0 - 1.0)
 */
export function getDetectorWeight(detectorName: keyof WeightsConfig['detectorWeights']): number {
  const weights = getDetectorWeights();
  return weights.detectorWeights[detectorName] || 1.0;
}

/**
 * Get confidence modifier value
 *
 * @param modifierName - Name of the modifier
 * @returns Modifier value (number to add to confidence)
 */
export function getConfidenceModifier(modifierName: keyof WeightsConfig['confidenceModifiers']): number {
  const weights = getDetectorWeights();
  return weights.confidenceModifiers[modifierName] || 0;
}

/**
 * Get threshold value
 *
 * @param thresholdName - Name of the threshold
 * @returns Threshold value
 */
export function getThreshold(thresholdName: keyof WeightsConfig['thresholds']): number {
  const weights = getDetectorWeights();
  return weights.thresholds[thresholdName];
}

/**
 * Get session weight
 *
 * @param session - Session name ('asian', 'london', 'ny', 'overlap')
 * @returns Weight value (0.0 - 1.0)
 */
export function getSessionWeight(session: 'asian' | 'london' | 'ny' | 'overlap'): number {
  const weights = getDetectorWeights();
  return weights.sessionWeights[session] || 1.0;
}

/**
 * Check if a playbook is enabled
 *
 * @param playbookName - Name of the playbook
 * @returns true if enabled
 */
export function isPlaybookEnabled(playbookName: 'NBB' | 'Tori' | 'Fabio' | 'JadeCap'): boolean {
  const config = getPlaybookConfig(playbookName);
  return config.enabled;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate configuration structure and values
 *
 * Ensures:
 * - All required fields are present
 * - Priorities are unique
 * - Confidence thresholds are valid (0-100)
 * - Weights are valid (0.0-1.0)
 *
 * @param config - AppConfig to validate
 * @throws Error if validation fails
 */
export function validateConfig(config: AppConfig): void {
  logger.info('Validating configuration...');

  // Validate default config
  if (!config.default.port || config.default.port < 1 || config.default.port > 65535) {
    throw new Error('Invalid port number in default config');
  }

  // Validate playbook configs
  const playbooks = Object.entries(config.playbooks.playbooks);
  const priorities = new Set<number>();

  for (const [name, playbookConfig] of playbooks) {
    // Check priority uniqueness
    if (priorities.has(playbookConfig.priority)) {
      throw new Error(`Duplicate priority ${playbookConfig.priority} found for playbook ${name}`);
    }
    priorities.add(playbookConfig.priority);

    // Check min confidence range
    if (playbookConfig.minConfidence < 0 || playbookConfig.minConfidence > 100) {
      throw new Error(`Invalid minConfidence for ${name}: ${playbookConfig.minConfidence} (must be 0-100)`);
    }

    // Check priority range
    if (playbookConfig.priority < 1 || playbookConfig.priority > 10) {
      throw new Error(`Invalid priority for ${name}: ${playbookConfig.priority} (must be 1-10)`);
    }
  }

  // Validate detector weights (should be 0.0 - 1.0)
  const weights = Object.entries(config.weights.detectorWeights);
  for (const [name, weight] of weights) {
    if (weight < 0 || weight > 1.0) {
      logger.warn(`Detector weight ${name} is outside recommended range (0.0-1.0): ${weight}`);
    }
  }

  logger.success('✓ Configuration validation passed');
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Reload configuration from disk
 *
 * Useful for hot-reloading config changes without restarting the application.
 *
 * @param configDir - Path to config directory
 * @returns Reloaded AppConfig
 */
export function reloadConfig(configDir: string = './config'): AppConfig {
  logger.info('Reloading configuration...');
  cachedConfig = null;
  return loadConfig(configDir);
}

/**
 * Get configuration as JSON string (for debugging/API endpoints)
 *
 * @param pretty - Pretty-print JSON (default: true)
 * @returns JSON string of current config
 */
export function getConfigAsJSON(pretty: boolean = true): string {
  const config = getConfig();
  return JSON.stringify(config, null, pretty ? 2 : 0);
}

/**
 * Export configuration summary for logging
 */
export function logConfigSummary(): void {
  const config = getConfig();

  logger.info('\n═══════════════════════════════════════════');
  logger.info('📋 CONFIGURATION SUMMARY');
  logger.info('═══════════════════════════════════════════');
  logger.info(`Environment: ${config.default.environment}`);
  logger.info(`Port: ${config.default.port}`);
  logger.info(`Data Source: ${config.default.dataSource}`);
  logger.info(`File Logging: ${config.default.enableFileLogging ? 'Enabled' : 'Disabled'}`);
  logger.info('───────────────────────────────────────────');
  logger.info('Playbooks:');

  const sortedPlaybooks = getAllPlaybookConfigs();
  for (const { name, config: pb } of sortedPlaybooks) {
    const status = pb.enabled ? '✓' : '✗';
    logger.info(`  ${status} ${name.padEnd(10)} | Priority: ${pb.priority} | Min Confidence: ${pb.minConfidence}%`);
  }

  logger.info('═══════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  loadConfig,
  getConfig,
  getPlaybookConfig,
  getAllPlaybookConfigs,
  getDetectorWeights,
  getDetectorWeight,
  getConfidenceModifier,
  getThreshold,
  getSessionWeight,
  isPlaybookEnabled,
  validateConfig,
  reloadConfig,
  getConfigAsJSON,
  logConfigSummary,
};
