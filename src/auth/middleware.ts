import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserPayload } from './authService';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Middleware to require authentication for protected routes
 * Extracts JWT token from Authorization header and verifies it
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and extract user payload
    const user = verifyToken(token);

    // Attach user to request object
    req.user = user;

    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Authentication failed' });
  }
}
