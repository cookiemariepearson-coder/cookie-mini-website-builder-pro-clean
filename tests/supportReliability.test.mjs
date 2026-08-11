import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCustomerRequestId } from '../lib/customerRequestId.mjs';
import { customerNotificationOutcome } from '../lib/customerNotificationOutcome.mjs';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

const accepted = (id) => ({ status: 'fulfilled', value: { accepted: true, id } });
const rejected = () => ({ status: 'rejected', reason: new Error('provider detail that must not be stored') });

test('customer request IDs include a collision-resistant nonce without customer data', () => {
  const first = createCustomerRequestId('DFY', 12345);
  const second = createCustomerRequestId('DFY', 12345);
  assert.match(first, /^DFY-[A-Z0-9]+-[A-F0-9]{8}$/);
  assert.notEqual(first, second);
  assert.equal(createCustomerRequestId('<bad prefix>', 12345).startsWith('BADPREFIX-'), true);
});

test('two accepted DFY notifications record a complete delivery outcome', () => {
  assert.deepEqual(customerNotificationOutcome(accepted('admin-1'), accepted('customer-1')), {
    adminAccepted: true,
    customerAccepted: true,
    notificationStatus: 'accepted',
    adminProviderMessageId: 'admin-1',
    customerProviderMessageId: 'customer-1',
    notificationError: null
  });
});

test('one failed DFY notification remains a visible partial delivery', () => {
  const result = customerNotificationOutcome(rejected(), accepted('customer-1'));
  assert.equal(result.notificationStatus, 'partial');
  assert.equal(result.adminAccepted, false);
  assert.equal(result.customerAccepted, true);
  assert.equal(result.notificationError, 'Owner notification delayed');
  assert.doesNotMatch(result.notificationError, /provider detail/i);
});

test('two failed notifications are recorded safely without provider response details', () => {
  const result = customerNotificationOutcome(rejected(), rejected());
  assert.equal(result.notificationStatus, 'rejected');
  assert.equal(result.adminProviderMessageId, null);
  assert.equal(result.customerProviderMessageId, null);
  assert.equal(result.notificationError, 'Owner notification delayed; Customer confirmation delayed');
});

test('DFY form has associated labels and an active spam honeypot', async () => {
  const page = await source('app/done-for-you/request/page.js');
  for (const id of ['dfy-service', 'dfy-name', 'dfy-business', 'dfy-business-type', 'dfy-email', 'dfy-phone', 'dfy-contact', 'dfy-action', 'dfy-details']) {
    assert.match(page, new RegExp(`htmlFor="${id}"`));
    assert.match(page, new RegExp(`id="${id}"`));
  }
  assert.match(page, /companyWebsite/);
  assert.match(page, /id="dfy-company-website"/);
});

test('DFY submission preserves stored requests when only one email is delayed', async () => {
  const route = await source('app/api/done-for-you/request/route.js');
  assert.match(route, /Promise\.allSettled/);
  assert.match(route, /customerNotificationOutcome/);
  assert.match(route, /!storedRequest\.ok && !notification\.adminAccepted/);
  assert.doesNotMatch(route, /Promise\.all\(\[/);
});

test('Contact submission remains successful when its durable record survives an email delay', async () => {
  const route = await source('app/api/contact/route.js');
  assert.match(route, /if \(!storedRequest\.ok\) throw emailError/);
  assert.match(route, /Your support request \$\{requestId\} was saved\. Email delivery is delayed/);
  assert.match(route, /notification_error: 'Owner notification delayed'/);
});

test('customer requests can only be listed through verified owner access', async () => {
  const [route, page, admin] = await Promise.all([
    source('app/api/admin/customer-requests/route.js'),
    source('app/admin/requests/page.js'),
    source('app/admin/page.js')
  ]);
  assert.match(route, /getVerifiedAdmin\(request\)/);
  assert.match(route, /\.from\('customer_requests'\)/);
  assert.match(route, /Cache-Control': 'private, no-store/);
  assert.doesNotMatch(route, /admin_provider_message_id|customer_provider_message_id/);
  assert.match(page, /Only the authorized platform owner can view customer request details/);
  assert.match(page, /fetch\('\/api\/admin\/customer-requests'/);
  assert.match(admin, /href="\/admin\/requests">Customer Requests/);
});
