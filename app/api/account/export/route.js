import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const { data, error } = await owner.supabase
      .from('websites')
      .select('slug,business_name,plan,status,access_status,subscription_status,monthly_price,extra_pages,site,created_at,updated_at')
      .eq('owner_id', owner.user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      account: { email: owner.email },
      websites: data || [],
      note: 'Gumroad subscriptions and refunds are managed separately and are not changed by this export.'
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'attachment; filename="cookie-mini-builder-account-export.json"'
      }
    });
  } catch (error) {
    console.error('[customer-account] export failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Your account export could not be prepared right now.' }, { status: 500 });
  }
}
