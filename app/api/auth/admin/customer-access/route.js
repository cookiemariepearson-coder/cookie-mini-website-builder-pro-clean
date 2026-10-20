import { NextResponse } from 'next/server';
import { CANONICAL_ADMIN_EMAIL, normalizeOwnerEmail } from '../../../../../lib/adminAuth.mjs';
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, SITE_OWNER_SESSION_COOKIE } from '../../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
  });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return response({ ok: false, error: 'Admin Access must be opened from the Mini Website Builder.' }, 403);
  }

  const token = request.cookies.get(SITE_OWNER_SESSION_COOKIE)?.value || '';
  if (!token) return response({ ok: false, error: 'Sign in to your owner customer account before opening Admin Access.' }, 401);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    const verifiedEmail = normalizeOwnerEmail(data?.user?.email);
    if (error || !data?.user?.id || verifiedEmail !== CANONICAL_ADMIN_EMAIL) {
      return response({ ok: false, error: 'Admin Access is restricted to the configured owner account.' }, 403);
    }

    // Admin routes independently verify this token and the canonical owner email.
    // Reusing the current secure token keeps the customer session alive when returning home.
    const result = response({ ok: true, destination: '/admin' });
    result.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    console.info('[owner-admin-access]', { event: 'CANONICAL_OWNER_SESSION_PROMOTED' });
    return result;
  } catch {
    return response({ ok: false, error: 'Admin Access is temporarily unavailable. Please try again.' }, 500);
  }
}
