import type { Request, Response, NextFunction } from 'express';

type RateLimitOptions = {
  name: string;
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
};

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(opts: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  const getKey = (req: Request) => {
    if (opts.keyGenerator) return opts.keyGenerator(req);
    // Prefer first IP when behind proxy (trust proxy must be enabled for req.ip to work properly)
    return String(req.ip || req.socket.remoteAddress || 'unknown');
  };

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = `${opts.name}:${getKey(req)}`;
    const now = Date.now();

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > opts.max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded (${opts.name}). Try again in ${retryAfterSec}s`,
      });
    }

    // Best-effort cleanup to prevent unbounded growth
    if (buckets.size > 50000) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }

    return next();
  };
}

