import fs from 'fs';
import path from 'path';

/**
 * ═══════════════════════════════════════════════════════════════
 * AGENT LOGGER - COMPREHENSIVE LOGGING SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * Features:
 * - Multiple log levels (info, warn, error, success, debug)
 * - File saving to logs/ directory with timestamps
 * - Formatted console output with optional colors
 * - Session/request tracking
 * - Structured log format for easy parsing
 *
 * Usage:
 * ```typescript
 * import { createLogger } from '@utils/agent_logger';
 *
 * const logger = createLogger('PlaybookNBB', 'session-123');
 * logger.info('Checking NBB conditions');
 * logger.success('NBB playbook matched!');
 * logger.error('Failed to detect MSS');
 * ```
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  sessionId?: string;
  message: string;
  data?: any;
}

export interface LoggerConfig {
  enableFileSave?: boolean;
  enableConsole?: boolean;
  enableColors?: boolean;
  logDirectory?: string;
  minLevel?: LogLevel;
}

const DEFAULT_CONFIG: Required<LoggerConfig> = {
  enableFileSave: true,
  enableConsole: true,
  enableColors: true,
  logDirectory: './logs',
  minLevel: 'debug',
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Log level colors
  info: '\x1b[36m',      // Cyan
  warn: '\x1b[33m',      // Yellow
  error: '\x1b[31m',     // Red
  success: '\x1b[32m',   // Green
  debug: '\x1b[35m',     // Magenta

  // Text colors
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

/**
 * Logger class
 */
export class Logger {
  private module: string;
  private sessionId?: string;
  private config: Required<LoggerConfig>;

  constructor(module: string, sessionId?: string, config?: LoggerConfig) {
    this.module = module;
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure log directory exists
    if (this.config.enableFileSave) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }
  }

  /**
   * Get current timestamp in ISO format
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Get formatted timestamp for display
   */
  private getDisplayTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Format log message for console output
   */
  private formatConsoleMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.getDisplayTimestamp();
    const sessionPrefix = this.sessionId ? `[${this.sessionId.substring(0, 8)}]` : '';

    if (!this.config.enableColors) {
      const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
      return `[${timestamp}] [${level.toUpperCase()}] [${this.module}] ${sessionPrefix} ${message}${dataStr}`;
    }

    // Colorized output
    const levelColor = COLORS[level];
    const levelLabel = level.toUpperCase().padEnd(7);
    const dataStr = data ? ` ${COLORS.dim}| ${JSON.stringify(data)}${COLORS.reset}` : '';

    return (
      `${COLORS.gray}[${timestamp}]${COLORS.reset} ` +
      `${levelColor}${levelLabel}${COLORS.reset} ` +
      `${COLORS.dim}[${this.module}]${COLORS.reset} ` +
      `${sessionPrefix ? COLORS.gray + sessionPrefix + COLORS.reset + ' ' : ''}` +
      `${message}${dataStr}`
    );
  }

  /**
   * Create log entry object
   */
  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: this.getTimestamp(),
      level,
      module: this.module,
      sessionId: this.sessionId,
      message,
      data,
    };
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFileSave) return;

    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `agent-${date}.log`;
      const filepath = path.join(this.config.logDirectory, filename);

      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filepath, logLine, 'utf-8');
    } catch (error) {
      // Avoid infinite loop - just log to console
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data);

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatConsoleMessage(level, message, data);
      console.log(formattedMessage);
    }

    // File output
    this.writeToFile(entry);
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Log success message
   */
  public success(message: string, data?: any): void {
    this.log('success', message, data);
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Create a child logger with same session but different module
   */
  public child(module: string): Logger {
    return new Logger(module, this.sessionId, this.config);
  }

  /**
   * Update session ID
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
}

/**
 * Create a new logger instance
 *
 * @param module - Module name (e.g., 'NBB', 'Classifier', 'API')
 * @param sessionId - Optional session/request ID for tracking
 * @param config - Optional logger configuration
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('NBB', 'req-abc123');
 * logger.info('Validating HTF bias');
 * logger.success('NBB conditions met');
 * ```
 */
export function createLogger(
  module: string,
  sessionId?: string,
  config?: LoggerConfig
): Logger {
  return new Logger(module, sessionId, config);
}

/**
 * Global logger instance (for simple use cases)
 */
export const globalLogger = createLogger('Agent');

/**
 * Convenience exports
 */
export default {
  createLogger,
  Logger,
  globalLogger,
};
