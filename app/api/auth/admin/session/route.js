import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getVerifiedAdmin, isAllowedAdminEmail, ownerEmail } from '../../../../../lib/siteOwnerAuth';
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

export async function POST(req) {
  const { accessToken } = await req.json().catch(() => ({}));
  if (!accessToken) return privateResponse({ ok: false, error: 'Missing secure sign-in token.' }, 400);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const email = ownerEmail(data?.user);
  if (error || !data?.user || !isAllowedAdminEmail(email)) {
    return privateResponse({ ok: false, error: 'This owner link is invalid, expired, or unauthorized.' }, 403);
  }
  const response = privateResponse({ ok: true, email });
  response.cookies.set(ADMIN_SESSION_COOKIE, accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60
  });
  return response;
}

export async function DELETE() {
  const response = privateResponse({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
