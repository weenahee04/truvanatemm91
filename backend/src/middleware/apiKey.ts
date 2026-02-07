import type { Request, Response, NextFunction } from 'express';

/**
 * Optional API key protection:
 * - If env var is NOT set -> allow (no breaking change)
 * - If env var IS set -> require header: X-API-Key
 */
export function requireApiKey(envVarName = 'API_KEY') {
  return function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    const expected = process.env[envVarName];
    if (!expected) return next();

    const got = req.header('x-api-key') || req.header('X-API-Key');
    if (!got || got !== expected) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    return next();
  };
}

