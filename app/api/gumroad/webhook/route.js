import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function normalize(value) {
  return String(value || '').trim();
}

function slugify(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/www\./, '')
    .replace(/\.cookiesdigitalcreations\.com.*$/, '')
    .replace(/cookiesdigitalcreations\.com\/site\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function lowerPayloadText(payload) {
  return Object.entries(payload)
    .map(([k, v]) => `${k}:${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ')
    .toLowerCase();
}

function extractEmail(payload) {
  return normalize(payload.email || payload.purchaser_email || payload.customer_email || payload.buyer_email || payload.seller_email).toLowerCase();
}

function extractProductName(payload) {
  return normalize(payload.product_name || payload.product_title || payload.name || payload.product || payload.product_permalink || payload.permalink);
}

function extractPlan(payload) {
  const text = lowerPayloadText(payload);
  if (text.includes('extra page') || text.includes('extra-page') || text.includes('add-on') || text.includes('addon')) return 'extra_page';
  if (text.includes('premium')) return 'premium';
  if (text.includes('business')) return 'business';
  if (text.includes('starter')) return 'starter';
  if (text.includes('free launch') || text.includes('free-page') || text.includes('free page')) return 'free';
  return '';
}

function extractSlug(payload) {
  const directKeys = [
    'website_slug', 'website_subdomain', 'subdomain', 'slug', 'website_name',
    'preferred_website_name', 'preferred_website_name_subdomain', 'business_slug'
  ];
  for (const key of directKeys) {
    if (payload[key]) return slugify(payload[key]);
  }

  // Gumroad custom fields can arrive as JSON strings, keyed objects, or flattened labels.
  const candidates = [];
  for (const [key, value] of Object.entries(payload)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (cleanKey.includes('subdomain') || cleanKey.includes('website_name') || cleanKey.includes('website_address') || cleanKey.includes('site_name')) {
      candidates.push(value);
    }
    if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            const label = normalize(item?.name || item?.label || item?.field || item?.key).toLowerCase();
            if (label.includes('subdomain') || label.includes('website') || label.includes('site name')) candidates.push(item?.value || item?.answer);
          });
        } else if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([label, answer]) => {
            const l = label.toLowerCase();
            if (l.includes('subdomain') || l.includes('website') || l.includes('site name')) candidates.push(answer);
          });
        }
      } catch {}
    }
  }
  for (const candidate of candidates) {
    const slug = slugify(candidate);
    if (slug) return slug;
  }
  return '';
}

function statusForResource(resource) {
  switch (resource) {
    case 'sale':
    case 'subscription_restarted':
    case 'subscription_updated':
    case 'dispute_won':
      return { subscription_status: 'active', access_status: 'active', status: 'published', paused_reason: null, canceled_at: null };
    case 'cancellation':
      return { subscription_status: 'canceled', access_status: 'paused', status: 'paused', paused_reason: 'Subscription canceled in Gumroad.', canceled_at: new Date().toISOString() };
    case 'subscription_ended':
      return { subscription_status: 'ended', access_status: 'paused', status: 'paused', paused_reason: 'Subscription ended in Gumroad.', canceled_at: new Date().toISOString() };
    case 'refund':
      return { subscription_status: 'refunded', access_status: 'paused', status: 'paused', paused_reason: 'Purchase refunded in Gumroad.', canceled_at: new Date().toISOString() };
    case 'dispute':
      return { subscription_status: 'disputed', access_status: 'paused', status: 'paused', paused_reason: 'Payment dispute opened in Gumroad.', canceled_at: new Date().toISOString() };
    default:
      return { subscription_status: 'received', access_status: 'active' };
  }
}

async function parseRequest(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await req.json();
  }
  const text = await req.text();
  const params = new URLSearchParams(text);
  const payload = {};
  for (const [k, v] of params.entries()) payload[k] = v;
  return payload;
}

async function findWebsite(supabase, { slug, email }) {
  if (slug) {
    const { data } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (data) return data;
  }
  if (email) {
    let result = await supabase.from('websites').select('*').eq('customer_email', email).order('updated_at', { ascending: false }).limit(1);
    if (result.data?.[0]) return result.data[0];
    result = await supabase.from('websites').select('*').eq('email', email).order('updated_at', { ascending: false }).limit(1);
    if (result.data?.[0]) return result.data[0];
    result = await supabase.from('websites').select('*').eq('gumroad_email', email).order('updated_at', { ascending: false }).limit(1);
    if (result.data?.[0]) return result.data[0];
  }
  return null;
}

export async function POST(req) {
  const resourceFromQuery = new URL(req.url).searchParams.get('resource') || '';
  const receivedAt = new Date().toISOString();
  let payload = {};
  try {
    payload = await parseRequest(req);
    const supabase = getSupabaseAdmin();
    const resource = normalize(payload.resource_name || payload.resource || payload.event || resourceFromQuery || 'sale');
    const email = extractEmail(payload);
    const slug = extractSlug(payload);
    const plan = extractPlan(payload);
    const productName = extractProductName(payload);
    const saleId = normalize(payload.sale_id || payload.id || payload.order_id || payload.purchase_id);
    const subscriptionId = normalize(payload.subscription_id || payload.subscription || payload.subscriber_id);
    const productId = normalize(payload.product_id || payload.product_permalink || payload.permalink);
    const eventKey = normalize(payload.event_id || payload.webhook_id || `${resource}:${saleId || subscriptionId || email || 'unknown'}:${receivedAt}`);

    let matched = await findWebsite(supabase, { slug, email });
    let action = 'logged_only_no_matching_website';

    if (matched) {
      const statusUpdate = statusForResource(resource);
      const updates = {
        ...statusUpdate,
        payment_provider: 'gumroad',
        gumroad_email: email || matched.gumroad_email || null,
        gumroad_sale_id: saleId || matched.gumroad_sale_id || null,
        gumroad_subscription_id: subscriptionId || matched.gumroad_subscription_id || null,
        gumroad_product_id: productId || matched.gumroad_product_id || null,
        gumroad_product_name: productName || matched.gumroad_product_name || null,
        gumroad_last_event: resource,
        gumroad_last_event_at: receivedAt,
        updated_at: receivedAt
      };

      if (resource === 'sale' || resource === 'subscription_restarted' || resource === 'subscription_updated' || resource === 'dispute_won') {
        updates.last_payment_at = receivedAt;
      }
      if (plan && plan !== 'extra_page') updates.plan = plan;
      if (plan === 'extra_page') updates.extra_page_subscription_status = (statusUpdate.access_status === 'paused') ? 'paused' : 'active';

      const { error: updateError } = await supabase.from('websites').update(updates).eq('slug', matched.slug);
      if (updateError) throw updateError;
      action = `matched_${matched.slug}_${statusUpdate.subscription_status || resource}`;
    }

    await supabase.from('gumroad_events').upsert({
      event_key: eventKey,
      resource_name: resource,
      email,
      sale_id: saleId || null,
      subscription_id: subscriptionId || null,
      product_id: productId || null,
      product_name: productName || null,
      matched_slug: matched?.slug || slug || null,
      matched_plan: plan || null,
      action_taken: action,
      payload,
      processed_at: receivedAt
    }, { onConflict: 'event_key' });

    return NextResponse.json({ ok: true, action, matchedSlug: matched?.slug || null });
  } catch (error) {
    // Return 200 so Gumroad does not keep retrying a malformed event forever.
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('gumroad_events').insert({
        event_key: `error:${Date.now()}`,
        resource_name: resourceFromQuery || 'unknown',
        action_taken: `error:${error.message}`,
        payload: payload || {},
        processed_at: new Date().toISOString()
      });
    } catch {}
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}
