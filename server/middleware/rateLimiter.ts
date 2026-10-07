/**
 * SEEMADRISHTI AI — High-Throughput Sliding-Window API Rate Limiter
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  bypassIps?: string[];
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests || 300; // 300 req/min default
  const bypassIps = new Set(options.bypassIps || ['127.0.0.1', '::1', 'localhost']);
  const message = options.message || 'Too many tactical API requests. Please decelerate call frequency.';

  const ipStore = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if rate limiting is explicitly disabled
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const now = Date.now();
    // Opportunistic lazy cleanup for memory bounds
    if (ipStore.size > 2000) {
      for (const [ip, rec] of ipStore.entries()) {
        if (now > rec.resetTime) {
          ipStore.delete(ip);
        }
      }
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Allow internal loopback bypass when requested or configured
    if (bypassIps.has(clientIp) && req.headers['x-bypass-rate-limit'] === 'true') {
      res.setHeader('X-RateLimit-Bypassed', 'true');
      return next();
    }

    let record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds.toString());
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
}
