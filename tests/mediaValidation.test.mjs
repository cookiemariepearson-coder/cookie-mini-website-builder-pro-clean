import test from 'node:test';
import assert from 'node:assert/strict';
import {
  safeMediaLabel,
  validateMediaUrl,
  validateSiteMedia,
  validateStoredImageDataUrl
} from '../lib/mediaValidation.mjs';

const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('accepts a valid stored PNG and reads its dimensions', () => {
  const result = validateStoredImageDataUrl(onePixelPng);
  assert.equal(result.ok, true);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
});

test('rejects dangerous or unsupported upload content', () => {
  assert.equal(validateStoredImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=').ok, false);
  assert.equal(validateMediaUrl('javascript:alert(1)').ok, false);
  assert.equal(validateMediaUrl('data:text/html,hello').ok, false);
});

test('enforces media quantity and cleans filenames', () => {
  const site = { media: Array.from({ length: 21 }, () => ({ kind: 'link', url: 'https://example.com/video' })) };
  assert.equal(validateSiteMedia(site).ok, false);
  assert.equal(safeMediaLabel('../../bad<script>.png'), 'badscript.png');
});
