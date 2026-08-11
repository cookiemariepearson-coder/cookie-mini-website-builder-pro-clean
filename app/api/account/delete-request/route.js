import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const limited = rateLimit(request, { name: 'account-delete-request', limit: 2, windowMs: 24 * 60 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'An account-deletion request was already submitted recently. Contact support if you need help.');
    const body = await request.json().catch(() => ({}));
    if (String(body.confirmation || '') !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ ok: false, error: 'Type DELETE MY ACCOUNT exactly to confirm this request.' }, { status: 400 });
    }
    const notification = await sendAdminNotification({
      subject: 'Customer account deletion request',
      event: 'Customer requested account deletion',
      slug: 'account-request',
      businessName: 'Mini Website Builder account',
      customerEmail: owner.email,
      details: 'Review owned websites, retained transaction records, and active Gumroad subscriptions before completing deletion. This request does not automatically cancel or refund Gumroad purchases.'
    });
    if (!notification.sent) throw new Error(notification.reason || 'Deletion request notification was not accepted.');
    return NextResponse.json({ ok: true, message: 'Your deletion request was sent to Cookie support. It does not automatically cancel or refund a Gumroad purchase.' });
  } catch (error) {
    console.error('[customer-account] deletion request failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Your deletion request could not be sent. Contact hello@cookiesdigitalcreations.com for help.' }, { status: 500 });
  }
}
