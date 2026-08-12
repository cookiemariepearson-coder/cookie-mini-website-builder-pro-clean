const API_ROOT = 'https://api.gumroad.com/v2';

function clean(value = '') {
  return String(value || '').trim();
}

async function gumroadGet(path, accessToken, fetchImpl) {
  const response = await fetchImpl(`${API_ROOT}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) {
    const error = new Error(response.status === 404 ? 'provider_record_not_found' : 'provider_request_failed');
    error.code = response.status === 404 ? 'provider_record_not_found' : 'provider_request_failed';
    throw error;
  }
  return data;
}

function safeSubscriber(record = {}) {
  return {
    id: clean(record.id),
    email: clean(record.user_email || record.email).toLowerCase(),
    product_id: clean(record.product_id),
    product_name: clean(record.product_name),
    created_at: record.created_at || null,
    user_requested_cancellation_at: record.user_requested_cancellation_at || null,
    restarted_at: record.restarted_at || null,
    cancelled_at: record.cancelled_at || null,
    ended_at: record.ended_at || null,
    failed_at: record.failed_at || null,
    recurrence: clean(record.recurrence),
    status: clean(record.status).toLowerCase()
  };
}

function safeSale(record = {}) {
  return {
    id: clean(record.id || record.sale_id),
    email: clean(record.purchase_email || record.email).toLowerCase(),
    product_id: clean(record.product_id),
    product_name: clean(record.product_name),
    subscription_id: clean(record.subscription_id),
    created_at: record.created_at || record.sale_timestamp || null,
    recurrence: clean(record.recurrence),
    updated_at: record.updated_at || null,
    refunded: record.refunded === true,
    partially_refunded: record.partially_refunded === true,
    disputed: record.disputed === true,
    dispute_won: record.dispute_won === true,
    chargedback: record.chargedback === true,
    chargebacked: record.chargebacked === true,
    cancelled: record.cancelled === true,
    ended: record.ended === true
  };
}

export async function fetchGumroadSubscriptionEvidence({ subscriptionId, saleId, accessToken, fetchImpl = fetch } = {}) {
  const token = clean(accessToken);
  if (!token) throw Object.assign(new Error('provider_access_not_configured'), { code: 'provider_access_not_configured' });
  const subscriberId = clean(subscriptionId);
  const purchaseId = clean(saleId);
  if (!subscriberId && !purchaseId) throw Object.assign(new Error('provider_reference_missing'), { code: 'provider_reference_missing' });

  const [subscriberResult, saleResult] = await Promise.allSettled([
    subscriberId
      ? gumroadGet(`/subscribers/${encodeURIComponent(subscriberId)}`, token, fetchImpl).then(data => safeSubscriber(data.subscriber || {}))
      : Promise.resolve(null),
    purchaseId
      ? gumroadGet(`/sales/${encodeURIComponent(purchaseId)}`, token, fetchImpl).then(data => safeSale(data.sale || {}))
      : Promise.resolve(null)
  ]);
  const subscriber = subscriberResult.status === 'fulfilled' ? subscriberResult.value : null;
  const sale = saleResult.status === 'fulfilled' ? saleResult.value : null;
  if (!subscriber && !sale) {
    const failure = subscriberResult.status === 'rejected' ? subscriberResult.reason : saleResult.reason;
    throw failure;
  }
  return { subscriber, sale };
}
