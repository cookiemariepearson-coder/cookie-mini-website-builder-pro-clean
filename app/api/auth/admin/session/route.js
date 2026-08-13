import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function GET(request) {
  const admin = await getVerifiedAdmin(request);
  if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);
  return privateResponse({ ok: true });
}

export async function DELETE(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  if (token) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.signOut(token, 'local');
    } catch {
      console.warn('[owner-password-auth]', { event: 'OWNER_SESSION_REVOCATION_FAILED' });
    }
  }
  const response = privateResponse({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...adminSessionCookieOptions(60), maxAge: 0 });
  return response;
}
