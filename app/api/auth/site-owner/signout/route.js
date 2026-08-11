import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { siteOwnerAccessToken } from '../../../../../lib/customerAuthUtils.mjs';
import { SITE_OWNER_SESSION_COOKIE, siteOwnerSessionCookieOptions } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const token = siteOwnerAccessToken(request) || request.cookies.get(SITE_OWNER_SESSION_COOKIE)?.value || '';
  if (token) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.signOut(token, 'local');
    } catch (error) {
      console.warn('[builder-customer-auth] sign-out revocation failed', { message: error?.message || String(error) });
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set(SITE_OWNER_SESSION_COOKIE, '', { ...siteOwnerSessionCookieOptions(60), maxAge: 0 });
  return response;
}
