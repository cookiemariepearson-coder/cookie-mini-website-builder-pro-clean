import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';
import { getDfyCheckoutConfiguration } from '../../../../lib/dfyCommerce.mjs';

export const dynamic = 'force-dynamic';

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return response({ ok: false, error: admin.error }, admin.status);

    const { data, error } = await admin.supabase
      .from('customer_requests')
      .select('request_id,request_type,service,customer_name,business_name,business_type,customer_email,phone,preferred_contact,customer_action,details,checkout_required,checkout_configured,notification_status,notification_error,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(250);
    if (error) throw error;

    const checkoutConfiguration = getDfyCheckoutConfiguration(process.env).map((item) => ({
      service: item.service,
      environmentVariable: item.envName,
      configured: item.configured,
      reason: item.reason,
      conflictsWith: item.conflictsWith || '',
      setupPrice: item.setupPrice,
      purchaseType: item.purchaseType
    }));

    return response({ ok: true, requests: data || [], checkoutConfiguration });
  } catch (error) {
    console.error('[admin-customer-requests] load failed', { message: error?.message || String(error) });
    return response({ ok: false, error: 'Support and Done-for-You requests could not be loaded.' }, 500);
  }
}
