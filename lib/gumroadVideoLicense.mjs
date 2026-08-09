import crypto from 'crypto';

const GUMROAD_LICENSE_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

export function normalizePurchaseEmail(value = '') {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function privateLicenseSubject(licenseKey = '') {
  const value = String(licenseKey || '').trim();
  return value ? `license:${crypto.createHash('sha256').update(value).digest('hex').slice(0, 24)}` : 'license:missing';
}

export function videoPurchaseIdentity(purchase = {}) {
  const saleId = String(purchase.sale_id || '').trim();
  const email = normalizePurchaseEmail(purchase.email || purchase.purchaser_email || '');
  return saleId && email ? { saleId, email } : null;
}

export async function verifyAiVideoLicense({ licenseKey, productId, fetchImpl = fetch } = {}) {
  const key = String(licenseKey || '').trim();
  const exactProductId = String(productId || '').trim();
  if (!key) return { valid: false, reason: 'missing_license' };
  if (!exactProductId) return { valid: false, reason: 'missing_product_configuration' };

  const form = new URLSearchParams({
    product_id: exactProductId,
    license_key: key,
    increment_uses_count: 'false'
  });
  const response = await fetchImpl(GUMROAD_LICENSE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const data = await response.json().catch(() => ({}));
  const purchase = data.purchase || {};
  const blocked = Boolean(
    purchase.refunded || purchase.chargebacked || purchase.disputed ||
    purchase.subscription_ended_at || purchase.cancelled_at
  );
  if (!response.ok || data.success !== true || blocked) {
    return { valid: false, reason: blocked ? 'inactive_purchase' : 'invalid_license' };
  }

  const identity = videoPurchaseIdentity(purchase);
  if (!identity) return { valid: false, reason: 'missing_purchase_identity' };
  return { valid: true, purchase, identity };
}
