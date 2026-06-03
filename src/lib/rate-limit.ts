// Rate limiting utilities for API routes.
// Production-ready: Upstash Redis-backed (shared across serverless instances)

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitKeyType = 'chat' | 'stock' | 'general';

function getRedisClient() {
  // Uses Upstash environment variables.
  // In local dev you can set UPSTASH_REDIS_REST_URL/TOKEN or stub via a
  // proxy Redis instance.
  return Redis.fromEnv();
}

function makeLimiter({
  keyPrefix,
  maxRequests,
}: {
  keyPrefix: string;
  maxRequests: number;
}) {
  return new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(maxRequests, '1 m'),
    prefix: keyPrefix,
  });
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters: Record<RateLimitKeyType, ReturnType<typeof makeLimiter>> = {
  // Chat endpoint - 30 requests per minute
  chat: makeLimiter({ keyPrefix: 'alphaSight:chat', maxRequests: 30 }),

  // Stock search - 60 requests per minute
  stock: makeLimiter({ keyPrefix: 'alphaSight:stock', maxRequests: 60 }),

  // General API - 100 requests per minute
  general: makeLimiter({ keyPrefix: 'alphaSight:general', maxRequests: 100 }),
};

export async function checkRateLimit({
  limiter,
  key,
  route,
}: {
  limiter: ReturnType<typeof makeLimiter>;
  key: string;
  route: RateLimitKeyType;
}): Promise<
  | {
      allowed: true;
      limit: number;
      remaining: number;
      resetAt?: Date;
      retryAfterSeconds?: number;
    }
  | {
      allowed: false;
      limit: number;
      remaining: number;
      resetAt?: Date;
      retryAfterSeconds?: number;
    }
> {
  try {
    const result = await (limiter as any).limit(key);
    // Upstash returns something like:
    // { success: boolean, limit: number, remaining: number, reset: number }
    const allowed = Boolean(result.success);
    const limit = Number(result.limit ?? 0);
    const remaining = Number(result.remaining ?? 0);
    const resetMs = Number(result.reset ?? 0);
    const retryAfterSeconds =
      resetMs > 0 ? Math.max(0, Math.ceil((resetMs - Date.now()) / 1000)) : undefined;

    return {
      allowed,
      limit,
      remaining,
      resetAt: resetMs ? new Date(resetMs) : undefined,
      retryAfterSeconds,
    } as any;
  } catch (err) {
    // Fail open if Upstash is misconfigured, but log loudly.
    logger.error('Rate limiter error; failing open', err, { route, key });
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
    };
  }
}

export function buildRateLimitResponse({
  route,
  retryAfterSeconds,
  limit,
  remaining,
}: {
  route: RateLimitKeyType;
  retryAfterSeconds?: number;
  limit: number;
  remaining: number;
}) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
  };
  if (typeof retryAfterSeconds === 'number') {
    headers['Retry-After'] = String(retryAfterSeconds);
  }

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers }
  );
}

// Helper to extract user identifier from request
export function getUserIdentifier(request: NextRequest): string {
  // Authenticated users should be rate-limited by their user id.
  // For guests, use IP.
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim();

  // If caller passes user-id header/cookie, it will be preferred.
  const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;

  return userId || ip || 'anonymous';
}

