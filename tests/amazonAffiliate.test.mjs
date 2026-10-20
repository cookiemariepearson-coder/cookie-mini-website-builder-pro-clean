import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_AMAZON_AFFILIATE_URL, normalizeAmazonAffiliateUrl } from '../lib/amazonAffiliate.mjs';

test('the supplied Amazon short link is accepted as the initial affiliate URL', () => {
  assert.equal(normalizeAmazonAffiliateUrl(DEFAULT_AMAZON_AFFILIATE_URL), DEFAULT_AMAZON_AFFILIATE_URL);
});

test('HTTPS Amazon product links are accepted', () => {
  assert.equal(normalizeAmazonAffiliateUrl('https://www.amazon.com/dp/B000000000'), 'https://www.amazon.com/dp/B000000000');
});

test('non-Amazon, insecure and credential-bearing destinations are rejected', () => {
  assert.equal(normalizeAmazonAffiliateUrl('http://amzn.to/3VTO2he'), '');
  assert.equal(normalizeAmazonAffiliateUrl('https://example.com/offer'), '');
  assert.equal(normalizeAmazonAffiliateUrl('javascript:alert(1)'), '');
  assert.equal(normalizeAmazonAffiliateUrl('https://user:pass@amzn.to/3VTO2he'), '');
  assert.equal(normalizeAmazonAffiliateUrl(''), '');
});
