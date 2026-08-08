import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeSlug(value) {
  let input = String(value || '').trim().toLowerCase();
  if (!input) return '';
  input = input.replace(/^https?:\/\//, '').replace(/^www\./, '');
  input = input.split('?')[0].split('#')[0];
  if (input.includes('/site/')) input = input.split('/site/')[1] || input;
  input = input.split('/')[0] || input;
  const root = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').toLowerCase();
  if (input.endsWith(`.${root}`)) input = input.slice(0, -1 * (`.${root}`).length);
  if (input === root) return '';
  return input.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function supabaseGet(path) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: [] };
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(), cache: 'no-store' });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export async function GET(request) {
  const access = verifyVideoAccessToken(request.headers.get('x-video-access-token') || '');
  if (!access) return NextResponse.json({ ok: false, error: 'Unlock AI Video Studio to view saved video results.' }, { status: 401 });

  let slug = '';
  if (access.kind === 'standalone' && access.saleId) {
    slug = `standalone-${crypto.createHash('sha256').update(String(access.saleId)).digest('hex').slice(0, 24)}`;
  } else if (access.kind === 'website-plan' && access.slug && access.ownerId) {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    if (String(access.ownerId) !== String(owner.user.id)) return NextResponse.json({ ok: false, error: 'Re-verify this website plan from your secure owner session.' }, { status: 403 });
    slug = normalizeSlug(access.slug);
  }
  if (!slug) return NextResponse.json({ ok: false, error: 'This video access pass is no longer valid. Verify access again.' }, { status: 403 });

  const safeColumns = 'id,website_slug,business_name,status,heygen_session_id,heygen_video_id,video_type,platform,plan,video_url,thumbnail_url,duration,failure_code,failure_message,created_at,checked_at,updated_at';
  const path = `heygen_video_jobs?select=${safeColumns}&website_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&limit=30`;
  const result = await supabaseGet(path);

  if (result.missing) {
    console.error('[heygen-jobs] storage configuration missing');
    return NextResponse.json({ ok: false, error: 'Video results are temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  if (!result.ok) {
    console.error('[heygen-jobs] storage lookup failed', { status: result.status });
    return NextResponse.json({ ok: false, error: 'Video results could not be loaded. Please try again shortly.' }, { status: result.status || 500 });
  }

  return NextResponse.json({ ok: true, jobs: Array.isArray(result.data) ? result.data : [] });
}
