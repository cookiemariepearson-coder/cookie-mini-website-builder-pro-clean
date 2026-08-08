import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, rateLimitResponse } from '../lib/rateLimit.mjs';

test('limits repeated requests and supplies retry guidance', async () => {
  const request = new Request('https://example.com/api', { headers: { 'x-forwarded-for': '203.0.113.10' } });
  const name = `test-${Date.now()}-${Math.random()}`;
  assert.equal(rateLimit(request, { name, limit: 2, windowMs: 60000 }).ok, true);
  assert.equal(rateLimit(request, { name, limit: 2, windowMs: 60000 }).ok, true);
  const blocked = rateLimit(request, { name, limit: 2, windowMs: 60000 });
  assert.equal(blocked.ok, false);
  const response = rateLimitResponse(blocked);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal((await response.json()).ok, false);
});
