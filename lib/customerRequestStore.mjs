function headers() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

function configuration() {
  return {
    url: String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, ''),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

async function requestStore(path, options) {
  const { url, key } = configuration();
  if (!url || !key) return { ok: false, missing: true, status: 0, data: null };
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: headers() });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export async function createCustomerRequest(row) {
  return requestStore('customer_requests', { method: 'POST', body: JSON.stringify(row) });
}

export async function updateCustomerRequest(requestId, update) {
  return requestStore(`customer_requests?request_id=eq.${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...update, updated_at: new Date().toISOString() })
  });
}
