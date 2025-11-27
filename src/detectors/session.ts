import { SessionInfo } from '@custom-types/detector';
import { createLogger } from '@utils/agent_logger';

// Create logger for session detector
const logger = createLogger('Session-Detector');

/**
 * ═══════════════════════════════════════════════════════════════
 * SESSION DETECTOR
 * ═══════════════════════════════════════════════════════════════
 * Determines current trading session (Asian, London, NY).
 *
 * Session Times (UTC):
 *   - Asian:  00:00 - 09:00 UTC
 *   - London: 08:00 - 17:00 UTC
 *   - NY:     13:00 - 22:00 UTC
 *
 * Note: Sessions overlap (London/NY from 13:00-17:00)
 */

/**
 * Detect Current Trading Session
 * @param currentTime - Optional current time (defaults to now)
 * @returns SessionInfo with current session and active status
 */
export function detectSession(currentTime?: Date): SessionInfo {
  const now = currentTime || new Date();
  const hour = now.getUTCHours();

  logger.info(`  🌍 Detecting Trading Session (UTC Hour: ${hour})...`);

  // Determine session based on UTC hour
  let current: 'asian' | 'london' | 'ny' = 'asian';
  let isActive = true;

  if (hour >= 0 && hour < 8) {
    // Asian session (00:00 - 08:00 UTC)
    current = 'asian';
    logger.info('  → Session: ASIAN (00:00 - 09:00 UTC)');
  } else if (hour >= 8 && hour < 13) {
    // London session (08:00 - 13:00 UTC, before overlap)
    current = 'london';
    logger.info('  → Session: LONDON (08:00 - 17:00 UTC)');
  } else if (hour >= 13 && hour < 17) {
    // London/NY overlap (13:00 - 17:00 UTC) - prioritize NY
    current = 'ny';
    logger.info('  → Session: NY (London/NY Overlap) (13:00 - 22:00 UTC)');
  } else if (hour >= 17 && hour < 22) {
    // NY session (17:00 - 22:00 UTC)
    current = 'ny';
    logger.info('  → Session: NY (13:00 - 22:00 UTC)');
  } else {
    // After NY close (22:00 - 00:00 UTC) - Asian pre-session
    current = 'asian';
    logger.info('  → Session: ASIAN (Pre-session) (22:00 - 00:00 UTC)');
  }

  // Check if session is active (not in transition periods)
  // Transition periods: 09:00-10:00, 17:00-18:00, 22:00-23:00
  if (hour === 9 || hour === 17 || hour === 22) {
    isActive = false;
    logger.warn('  ⚠ Session Transition Period - Low Activity');
  }

  return {
    current,
    isActive,
  };
}

/**
 * Check if currently in optimal trading window
 * Optimal windows:
 *   - London open: 08:00-12:00 UTC
 *   - NY open: 13:30-16:00 UTC (9:30 AM - 12:00 PM EST)
 */
export function isOptimalTradingWindow(currentTime?: Date): boolean {
  const now = currentTime || new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // London optimal: 08:00-12:00 UTC
  if (hour >= 8 && hour < 12) {
    return true;
  }

  // NY optimal: 13:30-16:00 UTC (9:30 AM - 12:00 PM EST)
  if (hour === 13 && minute >= 30) {
    return true;
  }
  if (hour >= 14 && hour < 16) {
    return true;
  }

  return false;
}

/**
 * Get session name as string
 */
export function getSessionName(session: 'asian' | 'london' | 'ny'): string {
  const names = {
    asian: 'Asian Session',
    london: 'London Session',
    ny: 'New York Session',
  };
  return names[session];
}
