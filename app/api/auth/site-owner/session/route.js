import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, SITE_OWNER_SESSION_COOKIE, siteOwnerSessionCookieOptions } from '../../../../../lib/siteOwnerAuth';

export async function GET(req) {
  const owner = await getVerifiedSiteOwner(req);
  if (!owner.ok) {
    return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }

  const response = NextResponse.json({ ok: true, email: owner.email, userId: owner.user.id }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
  if (owner.migratedBearer) response.cookies.set(SITE_OWNER_SESSION_COOKIE, owner.token, siteOwnerSessionCookieOptions());
  return response;
}
