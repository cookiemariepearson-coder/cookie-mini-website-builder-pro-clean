import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { safeCustomerReturnPath } from '../../../../../lib/commerceConfig.mjs';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    const ipLimited = rateLimit(req, { name: 'customer-auth-ip', limit: 10, windowMs: 15 * 60 * 1000 });
    const emailLimited = rateLimit(req, { name: 'customer-auth-email', limit: 5, windowMs: 15 * 60 * 1000, subject: email });
    if (!ipLimited.ok || !emailLimited.ok) return rateLimitResponse(!ipLimited.ok ? ipLimited : emailLimited, 'Please wait before requesting another sign-in email. You can also check your spam folder.');

    const origin = new URL(req.url).origin;
    const returnPath = safeCustomerReturnPath(body.returnPath);
    const redirectTo = `${origin}/customer/auth/callback?return=${encodeURIComponent(returnPath)}`;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    if (error) throw error;
    return NextResponse.json({
      ok: true,
      message: 'Check your email and tap the secure sign-in link. You can then manage websites saved with that email.'
    });
  } catch (error) {
    console.error('Customer sign-in request failed', error);
    return NextResponse.json({ ok: false, error: 'The secure email link could not be sent. Please try again shortly.' }, { status: 500 });
  }
}
