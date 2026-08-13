import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  OWNER_DASHBOARD_LOCKED_EVENT,
  OWNER_DASHBOARD_LOCKING_EVENT,
  checkOwnerDashboardSession,
  lockOwnerDashboard
} from '../lib/ownerDashboardSession.mjs';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('owner lock clears the server cookie before replacing the protected route', async () => {
  const calls = [];
  const events = [];
  const redirects = [];
  const result = await lockOwnerDashboard({
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
    eventTarget: { dispatchEvent: (event) => events.push(event.type) },
    navigate: (path) => redirects.push(path)
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [{ url: '/api/auth/admin/session', options: { method: 'DELETE', cache: 'no-store' } }]);
  assert.deepEqual(events, [OWNER_DASHBOARD_LOCKING_EVENT, OWNER_DASHBOARD_LOCKED_EVENT]);
  assert.deepEqual(redirects, ['/admin']);
});

test('owner-session status is determined by the server response, not browser state', async () => {
  const checked = await checkOwnerDashboardSession({
    fetcher: async () => ({ ok: false, status: 401, json: async () => ({ ok: false }) })
  });
  assert.deepEqual(checked, { authorized: false, status: 401, result: { ok: false } });
});

test('every admin route receives the owner header while public navigation keeps customer account behavior', async () => {
  const [layout, nav, customerLink] = await Promise.all([
    source('app/admin/layout.js'),
    source('lib/Nav.jsx'),
    source('components/CustomerAccountLink.js')
  ]);
  assert.match(layout, /<Nav context="owner"/);
  assert.match(nav, /if \(ownerContext\) return <nav className="nav" aria-label="Owner navigation">/);
  assert.match(nav, /<OwnerAccountControl \/>/);
  assert.match(nav, /Return to Main Website/);
  assert.match(nav, /<nav className="nav" aria-label="Main navigation">[\s\S]*<CustomerAccountLink \/>/);
  assert.match(customerLink, /openAccountModal\(\{ mode: 'signin', destination: '\/customer' \}\)/);
});

test('owner menu is keyboard-described and never invokes the customer modal', async () => {
  const ownerControl = await source('components/OwnerAccountControl.js');
  assert.match(ownerControl, /aria-haspopup="menu"/);
  assert.match(ownerControl, /aria-expanded=\{open\}/);
  assert.match(ownerControl, /event\.key === 'Escape'/);
  assert.match(ownerControl, /buttonRef\.current\?\.focus/);
  assert.match(ownerControl, /Lock Owner Dashboard/);
  assert.match(ownerControl, /Return to Main Website/);
  assert.doesNotMatch(ownerControl, /openAccountModal|site-owner\/session|localStorage/);
});

test('admin page lock buttons and the header use the same secure lock helper', async () => {
  const [adminPage, subscriptions, ownerControl, boundary] = await Promise.all([
    source('app/admin/page.js'),
    source('app/admin/subscriptions/page.js'),
    source('components/OwnerAccountControl.js'),
    source('components/AdminSessionBoundary.js')
  ]);
  for (const file of [adminPage, subscriptions, ownerControl, boundary]) assert.match(file, /lockOwnerDashboard/);
  assert.match(adminPage, /Lock Owner Dashboard/);
  assert.match(subscriptions, /Lock Owner Dashboard/);
  assert.match(boundary, /OWNER_DASHBOARD_LOCKING_EVENT/);
  assert.match(boundary, /event\.persisted/);
});

test('admin session check and protected data routes validate the dedicated admin cookie server-side', async () => {
  const [sessionRoute, adminAuth, subscriptionsRoute] = await Promise.all([
    source('app/api/auth/admin/session/route.js'),
    source('lib/siteOwnerAuth.js'),
    source('app/api/admin/subscriptions/list/route.js')
  ]);
  assert.match(sessionRoute, /export async function GET\(request\)/);
  assert.match(sessionRoute, /getVerifiedAdmin\(request\)/);
  assert.match(sessionRoute, /Cache-Control': 'private, no-store, max-age=0'/);
  assert.match(sessionRoute, /export async function DELETE/);
  assert.match(sessionRoute, /maxAge: 0/);
  assert.match(adminAuth, /req\.cookies\.get\(ADMIN_SESSION_COOKIE\)/);
  assert.doesNotMatch(adminAuth, /SITE_OWNER_SESSION_COOKIE.*ADMIN_SESSION_COOKIE|localStorage/);
  assert.match(subscriptionsRoute, /getVerifiedAdmin\(request\)/);
  assert.match(subscriptionsRoute, /maskCustomerIdentifier/);
});
