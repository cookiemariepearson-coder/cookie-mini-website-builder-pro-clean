import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('AI Video production HTML is revalidated and identifies its deployed build', async () => {
  const config = await fs.readFile(new URL('../next.config.js', import.meta.url), 'utf8');

  assert.match(config, /X-Cookie-Build/);
  assert.match(config, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(config, /source: '\/video-studio\/:path\*'/);
  assert.match(config, /source: '\/checkout\/ai-video'/);
  assert.equal(
    (config.match(/private, no-cache, no-store, max-age=0, must-revalidate/g) || []).length,
    2
  );
});

test('the application does not register a service worker that can retain old HTML', async () => {
  const files = [
    await fs.readFile(new URL('../app/layout.js', import.meta.url), 'utf8'),
    await fs.readFile(new URL('../app/video-studio/page.js', import.meta.url), 'utf8')
  ];

  assert.doesNotMatch(files.join('\n'), /navigator\.serviceWorker|serviceWorker\.register/);
});
