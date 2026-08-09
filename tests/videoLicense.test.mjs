import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_AI_VIDEO_PRODUCT_ID,
  privateLicenseSubject,
  verifyAiVideoLicense,
  videoPurchaseIdentity
} from '../lib/gumroadVideoLicense.mjs';

test('approved AI Video product fallback remains the proven Gumroad product', () => {
  assert.equal(APPROVED_AI_VIDEO_PRODUCT_ID, 'GE_fDgvz_GT29Fn6eSj9uw==');
});

function response({ ok = true, status = 200, data = {} } = {}) {
  return { ok, status, async json() { return data; } };
}

test('AI Video license verification uses the exact configured product without consuming a use', async () => {
  let request;
  const result = await verifyAiVideoLicense({
    licenseKey: 'not-a-real-license',
    productId: 'configured-ai-video-product',
    fetchImpl: async (url, options) => {
      request = { url, options, form: new URLSearchParams(String(options.body)) };
      return response({ data: { success: true, purchase: { sale_id: 'sale-a', email: 'Customer@Example.com' } } });
    }
  });
  assert.equal(result.valid, true);
  assert.equal(result.identity.email, 'customer@example.com');
  assert.equal(request.url, 'https://api.gumroad.com/v2/licenses/verify');
  assert.equal(request.form.get('product_id'), 'configured-ai-video-product');
  assert.equal(request.form.get('license_key'), 'not-a-real-license');
  assert.equal(request.form.get('increment_uses_count'), 'false');
});

test('invalid, refunded, revoked-like, and wrong-product license responses remain denied', async () => {
  const cases = [
    response({ ok: false, status: 404, data: { success: false } }),
    response({ data: { success: true, purchase: { sale_id: 'sale-a', email: 'a@example.com', refunded: true } } }),
    response({ data: { success: true, purchase: { sale_id: 'sale-a', email: 'a@example.com', cancelled_at: '2026-08-09' } } }),
    response({ data: { success: false, message: 'license not found for product' } })
  ];
  for (const gumroadResponse of cases) {
    const result = await verifyAiVideoLicense({
      licenseKey: 'not-a-real-license',
      productId: 'configured-ai-video-product',
      fetchImpl: async () => gumroadResponse
    });
    assert.equal(result.valid, false);
  }
});

test('a successful provider response without stable sale ownership is denied', async () => {
  assert.equal(videoPurchaseIdentity({ email: 'a@example.com' }), null);
  assert.equal(videoPurchaseIdentity({ sale_id: 'sale-a' }), null);
  const result = await verifyAiVideoLicense({
    licenseKey: 'not-a-real-license',
    productId: 'configured-ai-video-product',
    fetchImpl: async () => response({ data: { success: true, purchase: { email: 'a@example.com' } } })
  });
  assert.deepEqual(result, { valid: false, reason: 'missing_purchase_identity' });
});

test('license rate-limit identity is irreversible and never contains the supplied value', () => {
  const subject = privateLicenseSubject('not-a-real-license');
  assert.match(subject, /^license:[a-f0-9]{24}$/);
  assert.doesNotMatch(subject, /not-a-real-license/);
});
