import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { isAllowedAdminEmail } from '../../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';

export async function POST(req) {
  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid owner email.' }, { status: 400 });
    }
    if (!isAllowedAdminEmail(email)) {
      return NextResponse.json({ ok: false, error: 'This email is not authorized for owner access.' }, { status: 403 });
    }
    const ipLimited = rateLimit(req, { name: 'admin-auth-ip', limit: 10, windowMs: 15 * 60 * 1000 });
    const emailLimited = rateLimit(req, { name: 'admin-auth-email', limit: 5, windowMs: 15 * 60 * 1000, subject: email });
    if (!ipLimited.ok || !emailLimited.ok) return rateLimitResponse(!ipLimited.ok ? ipLimited : emailLimited, 'Please wait before requesting another owner sign-in email.');
    const origin = new URL(req.url).origin;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/admin/auth/callback`, shouldCreateUser: true }
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: 'Check your email and tap the secure owner sign-in link.' });
  } catch (error) {
    console.error('Owner sign-in request failed', error);
    return NextResponse.json({ ok: false, error: 'The secure owner link could not be sent. Try again shortly.' }, { status: 500 });
  }
}
