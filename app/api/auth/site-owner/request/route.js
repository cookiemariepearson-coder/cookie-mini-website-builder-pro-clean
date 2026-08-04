import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

function safeReturnPath(value = '') {
  const path = String(value || '').trim();
  if (path === '/builder' || path === '/customer') return path;
  if (/^\/customer\/edit\/[a-z0-9-]+$/.test(path)) return path;
  return '/customer';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const returnPath = safeReturnPath(body.returnPath);
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
