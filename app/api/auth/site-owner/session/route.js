import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, SITE_OWNER_SESSION_COOKIE, siteOwnerSessionCookieOptions } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const owner = await getVerifiedSiteOwner(req);
  if (!owner.ok) {
    return NextResponse.json({ ok: false, error: owner.error }, {
      status: owner.status,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' }
    });
  }

  const displayName = String(owner.user.user_metadata?.display_name || '').replace(/[<>]/g, '').trim().slice(0, 100);
  const response = NextResponse.json({ ok: true, email: owner.email, displayName, userId: owner.user.id }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
  if (owner.migratedBearer) response.cookies.set(SITE_OWNER_SESSION_COOKIE, owner.token, siteOwnerSessionCookieOptions());
  return response;
}
