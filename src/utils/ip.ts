/**
 * ═══════════════════════════════════════════════════════════════
 * IP HELPER UTILITY
 * ═══════════════════════════════════════════════════════════════
 * Helper functions for extracting client IP addresses from requests.
 *
 * Supports:
 * - Express.js Request objects
 * - X-Forwarded-For headers (proxy/load balancer)
 * - X-Real-IP headers
 * - Direct socket connections
 *
 * Usage:
 * ```typescript
 * import { getClientIP } from '@utils/ip';
 *
 * app.post('/webhook', (req, res) => {
 *   const ip = getClientIP(req);
 *   logger.info('Request received', { ip });
 * });
 * ```
 */

/**
 * Extract client IP address from request
 *
 * Checks in order:
 * 1. X-Forwarded-For header (if behind proxy/load balancer)
 * 2. X-Real-IP header (nginx proxy)
 * 3. req.ip (Express.js)
 * 4. req.socket.remoteAddress (direct connection)
 * 5. req.connection.remoteAddress (legacy)
 *
 * @param req - Express.js Request object (or compatible)
 * @returns IP address string or 'unknown'
 */
export function getClientIP(req: any): string {
  // Check X-Forwarded-For header (most common for proxied requests)
  // Format: "client, proxy1, proxy2"
  if (req.headers && req.headers['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      // Take the first IP in the chain (client)
      const ips = forwarded.split(',');
      return ips[0].trim();
    }
  }

  // Check X-Real-IP header (nginx)
  if (req.headers && req.headers['x-real-ip']) {
    const realIP = req.headers['x-real-ip'];
    if (typeof realIP === 'string') {
      return realIP.trim();
    }
  }

  // Check Express.js req.ip
  if (req.ip) {
    return req.ip;
  }

  // Check socket connection
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  // Check legacy connection property
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  return 'unknown';
}

/**
 * Sanitize IP address (remove IPv6 prefix if present)
 *
 * Converts "::ffff:192.168.1.1" to "192.168.1.1"
 *
 * @param ip - Raw IP address
 * @returns Sanitized IP address
 */
export function sanitizeIP(ip: string): string {
  if (!ip) return 'unknown';

  // Remove IPv6 prefix for IPv4 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  return ip;
}

/**
 * Get client IP and sanitize it
 *
 * @param req - Request object
 * @returns Sanitized IP address
 */
export function getClientIPSanitized(req: any): string {
  const ip = getClientIP(req);
  return sanitizeIP(ip);
}

/**
 * Check if IP is localhost
 *
 * @param ip - IP address
 * @returns true if localhost
 */
export function isLocalhost(ip: string): boolean {
  if (!ip) return false;

  const sanitized = sanitizeIP(ip);
  return (
    sanitized === '127.0.0.1' ||
    sanitized === 'localhost' ||
    sanitized === '::1' ||
    sanitized === '::ffff:127.0.0.1'
  );
}

/**
 * Check if IP is private network
 *
 * Private ranges:
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 *
 * @param ip - IP address
 * @returns true if private
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return false;

  const sanitized = sanitizeIP(ip);
  const parts = sanitized.split('.');

  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0/8
  if (first === 10) return true;

  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;

  return false;
}

/**
 * Mask IP address for privacy (GDPR compliance)
 *
 * Examples:
 * - "192.168.1.100" → "192.168.1.xxx"
 * - "2001:db8::1" → "2001:db8::xxx"
 *
 * @param ip - IP address
 * @returns Masked IP address
 */
export function maskIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';

  const sanitized = sanitizeIP(ip);

  // IPv4
  if (sanitized.includes('.')) {
    const parts = sanitized.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }

  // IPv6
  if (sanitized.includes(':')) {
    const parts = sanitized.split(':');
    return parts.slice(0, -1).join(':') + ':xxx';
  }

  return 'xxx';
}

/**
 * Generate a unique request ID based on IP and timestamp
 *
 * @param ip - IP address
 * @returns Request ID string
 */
export function generateRequestId(ip: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeIP(ip);
  const ipHash = Buffer.from(sanitized).toString('base64').substring(0, 8);
  return `req-${ipHash}-${timestamp}`;
}

export default {
  getClientIP,
  sanitizeIP,
  getClientIPSanitized,
  isLocalhost,
  isPrivateIP,
  maskIP,
  generateRequestId,
};
