import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { siteOwnerAccessToken } from '../../../../../lib/customerAuthUtils.mjs';
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, SITE_OWNER_SESSION_COOKIE, siteOwnerSessionCookieOptions } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const token = siteOwnerAccessToken(request) || request.cookies.get(SITE_OWNER_SESSION_COOKIE)?.value || '';
  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  const tokensToRevoke = [...new Set([token, adminToken].filter(Boolean))];
  if (tokensToRevoke.length) {
    try {
      const supabase = getSupabaseAdmin();
      for (const sessionToken of tokensToRevoke) {
        await supabase.auth.admin.signOut(sessionToken, 'local');
      }
    } catch (error) {
      console.warn('[builder-customer-auth] sign-out revocation failed', { message: error?.message || String(error) });
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set(SITE_OWNER_SESSION_COOKIE, '', { ...siteOwnerSessionCookieOptions(60), maxAge: 0 });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...adminSessionCookieOptions(60), maxAge: 0 });
  return response;
}
