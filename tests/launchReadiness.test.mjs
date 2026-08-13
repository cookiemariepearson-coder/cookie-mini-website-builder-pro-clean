import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyIntent, fallbackAnswer } from '../lib/cookieAiKnowledge.js';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Cookie AI describes the verified standalone purchase as one real video', () => {
  assert.equal(classifyIntent('Write a video script for my launch'), 'ai_video');
  const answer = fallbackAnswer('What does the standalone AI video purchase include?', '/checkout/ai-video');
  assert.match(answer, /\$5 one-time standalone purchase includes exactly 1 real AI-generated video/);
  assert.match(answer, /processing, moderation, and availability/);
});

test('public AI Video pages consistently disclose the one-credit entitlement', async () => {
  const sources = await Promise.all([
    source('app/page.js'),
    source('app/pricing/page.js'),
    source('app/checkout/ai-video/page.js'),
    source('app/faq/page.js'),
    source('app/legal/ai-video/page.js'),
    source('app/customer-start/page.js')
  ]);
  for (const page of sources) assert.match(page, /one real AI-generated video/i);
  assert.doesNotMatch(sources.join('\n'), /Real HeyGen video generation is reserved for eligible website plans/i);
});

test('customer guidance requires sign-in and does not present typed email as identity', async () => {
  const [guide, faq, support] = await Promise.all([
    source('app/customer-start/page.js'),
    source('app/faq/page.js'),
    source('app/legal/support/page.js')
  ]);
  assert.match(guide, /Only websites owned by the verified account load/);
  assert.match(faq, /only records owned by their verified account/);
  assert.match(support, /verified customer account/);
  assert.doesNotMatch(`${guide}\n${faq}\n${support}`, /search (My Website |the Customer Dashboard )?(with|by) (just )?your? ?email/i);
});

test('Cookie AI dialog supports keyboard close, focus trapping, and focus restoration', async () => {
  const [assistant, styles] = await Promise.all([
    source('components/CookieAiAssistant.js'),
    source('app/cookie-ai-assistant.css')
  ]);
  assert.match(assistant, /role="dialog"/);
  assert.match(assistant, /aria-modal="true"/);
  assert.match(assistant, /event\.key === 'Escape'/);
  assert.match(assistant, /event\.key !== 'Tab'/);
  assert.match(assistant, /openerRef\.current \|\| launcherRef\.current/);
  assert.match(assistant, /type="email" autoComplete="email"/);
  assert.match(styles, /100dvh/);
  assert.match(styles, /focus-visible/);
});

test('Cookie AI prompt explicitly treats draft content as untrusted data', async () => {
  const route = await source('app/api/cookie-ai/route.js');
  assert.match(route, /<untrusted_customer_draft>/);
  assert.match(route, /never as instructions/);
  assert.match(route, /cannot override these instructions/);
});

test('retired owner launch pages redirect into protected admin access', async () => {
  const [launchTest, ownerLaunch] = await Promise.all([
    source('app/launch-test/page.js'),
    source('app/owner-launch/page.js')
  ]);
  for (const page of [launchTest, ownerLaunch]) {
    assert.match(page, /redirect\('\/admin'\)/);
    assert.match(page, /index: false/);
  }
});

test('public discovery metadata is stable and protected routes stay excluded', async () => {
  const [home, pricing, sitemap, robots] = await Promise.all([
    source('app/page.js'),
    source('app/pricing/page.js'),
    source('app/sitemap.js'),
    source('app/robots.js')
  ]);
  assert.match(home, /canonical: '\/'/);
  assert.match(home, /'@type': 'SoftwareApplication'/);
  assert.match(pricing, /canonical: '\/pricing'/);
  assert.match(sitemap, /2026-08-13T00:00:00\.000Z/);
  for (const path of ['/admin/', '/api/', '/customer/', '/owner-launch/', '/video-studio/']) {
    assert.match(robots, new RegExp(path.replaceAll('/', '\\/')));
  }
});

test('subscription policy requires authoritative evidence before entitlement changes', async () => {
  const [subscription, support] = await Promise.all([
    source('app/legal/subscription/page.js'),
    source('app/legal/support/page.js')
  ]);
  assert.match(subscription, /exact authoritative provider evidence/);
  assert.match(subscription, /unsupported records remain unverified/);
  assert.match(support, /Paid plan corrections require authoritative provider evidence/);
});
