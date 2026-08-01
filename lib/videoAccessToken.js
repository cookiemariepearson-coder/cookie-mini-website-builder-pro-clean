import crypto from 'crypto';

function secret() {
  return process.env.VIDEO_ACCESS_SIGNING_SECRET || '';
}

export function createVideoAccessToken(payload = {}) {
  const key = secret();
  if (!key) throw new Error('Video access signing secret is not configured.');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyVideoAccessToken(token = '') {
  try {
    const key = secret();
    const [data, signature] = String(token).split('.');
    if (!key || !data || !signature) return null;
    const expected = crypto.createHmac('sha256', key).update(data).digest('base64url');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
