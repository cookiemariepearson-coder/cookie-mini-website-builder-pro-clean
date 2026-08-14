const buckets = globalThis.__cookieRateLimitBuckets || new Map();
globalThis.__cookieRateLimitBuckets = buckets;

function clientAddress(request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function rateLimit(request, { name, limit, windowMs, subject = '' }) {
  const now = Date.now();
  const identity = String(subject || clientAddress(request)).trim().toLowerCase().slice(0, 240);
  const key = `${name}:${identity}`;
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 10000) {
    for (const [candidate, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(candidate);
      if (buckets.size <= 8000) break;
    }
  }

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

export function rateLimitResponse(result, message = 'Please wait a moment before trying again.') {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(result.retryAfter),
      'Cache-Control': 'private, no-store, max-age=0'
    }
  });
}
