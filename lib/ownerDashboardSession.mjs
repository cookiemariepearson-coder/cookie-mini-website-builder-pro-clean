export const OWNER_DASHBOARD_LOCKING_EVENT = 'cookie:owner-dashboard-locking';
export const OWNER_DASHBOARD_LOCKED_EVENT = 'cookie:owner-dashboard-locked';
export const OWNER_DASHBOARD_LOCK_ERROR_EVENT = 'cookie:owner-dashboard-lock-error';

function browserTarget() {
  return typeof window === 'undefined' ? null : window;
}

function ownerSessionEvent(name, detail = {}) {
  if (typeof CustomEvent === 'function') return new CustomEvent(name, { detail });
  return { type: name, detail };
}

function announce(target, name, detail) {
  target?.dispatchEvent?.(ownerSessionEvent(name, detail));
}

export async function checkOwnerDashboardSession({ fetcher = globalThis.fetch } = {}) {
  const response = await fetcher('/api/auth/admin/session', {
    method: 'GET',
    cache: 'no-store'
  });
  const result = await response.json().catch(() => ({}));
  return { authorized: Boolean(response.ok && result.ok), status: response.status, result };
}

export async function lockOwnerDashboard({
  fetcher = globalThis.fetch,
  eventTarget = browserTarget(),
  navigate = (path) => window.location.replace(path)
} = {}) {
  announce(eventTarget, OWNER_DASHBOARD_LOCKING_EVENT);

  try {
    const response = await fetcher('/api/auth/admin/session', {
      method: 'DELETE',
      cache: 'no-store'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'The owner dashboard could not be locked.');

    announce(eventTarget, OWNER_DASHBOARD_LOCKED_EVENT);
    navigate('/admin');
    return result;
  } catch (error) {
    announce(eventTarget, OWNER_DASHBOARD_LOCK_ERROR_EVENT, { message: error?.message || 'The owner dashboard could not be locked.' });
    throw error;
  }
}
