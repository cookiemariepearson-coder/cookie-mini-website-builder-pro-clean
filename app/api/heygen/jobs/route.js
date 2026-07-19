import { NextResponse } from 'next/server';

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
  const url = new URL(request.url);
  const email = getEmail(url.searchParams.get('email') || '');
  const slug = normalizeSlug(url.searchParams.get('slug') || url.searchParams.get('website') || '');

  if (!email && !slug) {
    return NextResponse.json({ ok: false, error: 'Enter customer email or website/subdomain to find video results.' }, { status: 400 });
  }

  const filters = [];
  if (email) filters.push(`customer_email.eq.${email}`);
  if (slug) filters.push(`website_slug.eq.${slug}`);
  const filterQuery = filters.length > 1 ? `or=(${filters.join(',')})` : (email ? `customer_email=eq.${encodeURIComponent(email)}` : `website_slug=eq.${encodeURIComponent(slug)}`);
  const path = `heygen_video_jobs?select=*&${filterQuery}&order=created_at.desc&limit=30`;
  const result = await supabaseGet(path);

  if (result.missing) return NextResponse.json({ ok: false, error: 'Supabase is not connected.' }, { status: 500 });
  if (!result.ok) return NextResponse.json({ ok: false, error: 'Could not load video results. Run the HeyGen video results migration if needed.', detail: result.data }, { status: result.status || 500 });

  return NextResponse.json({ ok: true, jobs: Array.isArray(result.data) ? result.data : [] });
}
