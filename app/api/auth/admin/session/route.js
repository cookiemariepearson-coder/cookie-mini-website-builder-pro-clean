import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isAllowedAdminEmail, ownerEmail } from '../../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function POST(req) {
  const { accessToken } = await req.json().catch(() => ({}));
  if (!accessToken) return NextResponse.json({ ok: false, error: 'Missing secure sign-in token.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const email = ownerEmail(data?.user);
  if (error || !data?.user || !isAllowedAdminEmail(email)) {
    return NextResponse.json({ ok: false, error: 'This owner link is invalid, expired, or unauthorized.' }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true, email });
  response.cookies.set(ADMIN_SESSION_COOKIE, accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
