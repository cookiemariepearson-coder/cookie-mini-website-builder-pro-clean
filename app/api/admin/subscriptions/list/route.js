import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';
import { maskCustomerIdentifier } from '../../../../../lib/subscriptionLifecycle.mjs';
import { publicEventSummary } from '../../../../../lib/gumroadSubscriptionService.mjs';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

function websiteSummary(row = {}) {
  return {
    slug: row.slug,
    business_name: row.business_name || row.slug,
    customer: maskCustomerIdentifier(row.customer_email),
    plan: row.plan || 'free',
    status: row.status || 'draft',
    access_status: row.access_status || 'active',
    subscription_status: row.subscription_status || 'unverified',
    subscription_started_at: row.subscription_started_at,
    subscription_next_renewal_at: row.subscription_next_renewal_at,
    subscription_end_at: row.subscription_end_at,
    extra_page_subscription_status: row.extra_page_subscription_status || 'none',
    extra_page_subscription_end_at: row.extra_page_subscription_end_at,
    extra_pages: Math.max(0, Number(row.extra_pages) || 0),
    monthly_price: Math.max(0, Number(row.monthly_price) || 0),
    gumroad_product_name: row.gumroad_product_name || null,
    gumroad_last_event: row.gumroad_last_event || null,
    gumroad_last_event_at: row.gumroad_last_event_at || null,
    customer_deleted_at: row.customer_deleted_at || null,
    admin_notes: row.admin_notes || '',
    updated_at: row.updated_at
  };
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);
    const supabase = getSupabaseAdmin();
    const websiteFields = 'id,slug,business_name,customer_email,plan,status,access_status,subscription_status,subscription_started_at,subscription_next_renewal_at,subscription_end_at,extra_page_subscription_status,extra_page_subscription_end_at,extra_pages,monthly_price,gumroad_product_name,gumroad_last_event,gumroad_last_event_at,customer_deleted_at,admin_notes,updated_at';
    const eventFields = 'id,event_key,provider_event_id,resource_name,event_category,email,sale_id,subscription_id,product_name,matched_slug,matched_plan,action_taken,provider_event_at,received_at,processed_at,processing_status,review_status,review_reason,safe_action,internal_note,last_reconciled_at,reconciliation_source';
    const [{ data: websites, error: websiteError }, { data: events, error: eventError }] = await Promise.all([
      supabase.from('websites').select(websiteFields).order('updated_at', { ascending: false }).limit(200),
      supabase.from('gumroad_events').select(eventFields).order('received_at', { ascending: false }).limit(100)
    ]);
    if (websiteError) throw websiteError;
    if (eventError) throw eventError;
    return privateResponse({
      ok: true,
      websites: (websites || []).map(websiteSummary),
      events: (events || []).map(publicEventSummary)
    });
  } catch (error) {
    console.error('[admin-subscriptions] load failed', { code: String(error?.code || 'load_failed').slice(0, 100) });
    return privateResponse({ ok: false, error: 'Subscription records could not be loaded.' }, 500);
  }
}
