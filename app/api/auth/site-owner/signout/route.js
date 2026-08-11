import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { siteOwnerAccessToken } from '../../../../../lib/customerAuthUtils.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const token = siteOwnerAccessToken(request);
  if (token) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.signOut(token, 'local');
    } catch (error) {
      console.warn('[builder-customer-auth] sign-out revocation failed', { message: error?.message || String(error) });
    }
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
