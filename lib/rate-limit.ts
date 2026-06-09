import { NextResponse } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitRule = {
  name: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value !== 'false' && value !== '0';
}

export function getIntEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(request: Request, rule: RateLimitRule): RateLimitResult {
  const enabled = getBooleanEnv('RATE_LIMIT_ENABLED', true);
  const ip = getClientIp(request);
  const key = `${rule.name}:${ip}`;
  const now = Date.now();

  if (!enabled) {
    return {
      allowed: true,
      key,
      limit: rule.limit,
      remaining: rule.limit,
      resetAt: now + rule.windowMs,
      retryAfterSeconds: 0,
    };
  }

  pruneExpired(now);

  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + rule.windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(rule.limit - bucket.count, 0);
  const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 0);

  return {
    allowed: bucket.count <= rule.limit,
    key,
    limit: rule.limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds,
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: '请求过于频繁，请稍后再试。',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

export function reportsCreateRateLimitRule(): RateLimitRule {
  return {
    name: 'reports:create',
    limit: getIntEnv('RATE_LIMIT_REPORTS_PER_HOUR', 5),
    windowMs: 60 * 60 * 1000,
  };
}

export function exportRateLimitRule(): RateLimitRule {
  return {
    name: 'reports:export',
    limit: getIntEnv('RATE_LIMIT_EXPORT_PER_HOUR', 20),
    windowMs: 60 * 60 * 1000,
  };
}

export function adminMarkPaidRateLimitRule(): RateLimitRule {
  return {
    name: 'admin:mark-paid',
    limit: getIntEnv('RATE_LIMIT_ADMIN_PER_10MIN', 10),
    windowMs: 10 * 60 * 1000,
  };
}