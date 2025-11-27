import { SessionInfo } from '@types/detector';

/**
 * Session Detector
 * Determines current trading session
 */
export function detectSession(): SessionInfo {
  // TODO: Implement session detection logic
  return {
    current: 'ny',
    isActive: true,
  };
}
