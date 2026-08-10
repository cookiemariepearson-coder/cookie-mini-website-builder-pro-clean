import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { identifyWebsiteProduct, sanitizeGumroadPayload } from '../../../../lib/gumroadWebsiteProducts.mjs';

export const dynamic = 'force-dynamic';

function normalize(value) {
  return String(value || '').trim();
}

function safeEqual(left = '', right = '') {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAuthorizedWebhook(req) {
  const configured = String(process.env.GUMROAD_WEBHOOK_SECRET || '').trim();
  const provided = new URL(req.url).searchParams.get('token') || '';
  return Boolean(configured) && safeEqual(provided, configured);
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

function extractEmail(payload) {
  return normalize(payload.email || payload.purchaser_email || payload.customer_email || payload.buyer_email).toLowerCase();
}

function extractProductName(payload) {
  return normalize(payload.product_name || payload.product_title || payload.name || payload.product || payload.product_permalink || payload.permalink);
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
      return null;
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

async function findWebsite(supabase, { slug, subscriptionId }) {
  if (slug) {
    const { data } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (data) return data;
  }
  if (subscriptionId) {
    const { data } = await supabase.from('websites').select('*').eq('gumroad_subscription_id', subscriptionId).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function POST(req) {
  const resourceFromQuery = new URL(req.url).searchParams.get('resource') || '';
  const receivedAt = new Date().toISOString();
  let payload = {};
  try {
    if (!isAuthorizedWebhook(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized webhook.' }, { status: 401 });
    }
    payload = await parseRequest(req);
    const supabase = getSupabaseAdmin();
    const resource = normalize(payload.resource_name || payload.resource || payload.event || resourceFromQuery || 'sale');
    const email = extractEmail(payload);
    const slug = extractSlug(payload);
    const product = identifyWebsiteProduct(payload);
    const productName = extractProductName(payload);
    const saleId = normalize(payload.sale_id || payload.id || payload.order_id || payload.purchase_id);
    const subscriptionId = normalize(payload.subscription_id || payload.subscription || payload.subscriber_id);
    const productId = normalize(payload.product_id || payload.product_permalink || payload.permalink);
    const eventKey = normalize(payload.event_id || payload.webhook_id) || createHash('sha256')
      .update(JSON.stringify({ resource, saleId, subscriptionId, email, productId, payload }))
      .digest('hex');

    const safePayload = sanitizeGumroadPayload(payload);
    const { data: priorEvent } = await supabase.from('gumroad_events').select('action_taken, matched_slug').eq('event_key', eventKey).maybeSingle();
    if (priorEvent) return NextResponse.json({ ok: true, action: priorEvent.action_taken || 'duplicate_ignored', matchedSlug: priorEvent.matched_slug || null });

    let matched = product ? await findWebsite(supabase, { slug, subscriptionId }) : null;
    let action = !product
      ? 'logged_only_non_website_product'
      : (!slug && !subscriptionId ? 'unmatched_missing_website_identity' : 'unmatched_no_matching_website');

    if (matched) {
      const statusUpdate = statusForResource(resource);
      const ownerEmail = normalize(matched.customer_email || matched.site?.customerEmail).toLowerCase();
      const emailMatches = Boolean(email && ownerEmail && email === ownerEmail);
      if (!emailMatches) {
        action = 'unmatched_verified_owner_email_mismatch';
        matched = null;
      } else if (!statusUpdate) {
        action = 'logged_only_unsupported_resource';
      } else if (product.plan === 'extra_page') {
        const eligibleBasePlan = ['starter', 'business'].includes(String(matched.plan || '').toLowerCase())
          && String(matched.subscription_status || '').toLowerCase() === 'active'
          && String(matched.access_status || '').toLowerCase() === 'active';
        if (!eligibleBasePlan) {
          action = 'unmatched_extra_page_requires_active_paid_website';
          matched = null;
        } else {
          const paused = statusUpdate.access_status === 'paused';
          const quantity = Math.max(1, Math.min(20, Number(payload.quantity) || 1));
          const updates = {
            extra_page_subscription_status: paused ? 'paused' : 'active',
            extra_pages: paused ? Math.max(0, Number(matched.extra_pages) || 0) : Math.max(Number(matched.extra_pages) || 0, quantity),
            gumroad_last_event: `extra_page:${resource}`,
            gumroad_last_event_at: receivedAt,
            updated_at: receivedAt
          };
          const { error: updateError } = await supabase.from('websites').update(updates).eq('slug', matched.slug);
          if (updateError) throw updateError;
          action = `matched_extra_page_${paused ? 'paused' : 'active'}`;
        }
      } else {
        const updates = {
          ...statusUpdate,
          plan: product.plan,
          payment_provider: 'gumroad',
          gumroad_email: email,
          gumroad_sale_id: saleId || matched.gumroad_sale_id || null,
          gumroad_subscription_id: subscriptionId || matched.gumroad_subscription_id || null,
          gumroad_product_id: productId,
          gumroad_product_name: productName || product.name,
          gumroad_last_event: resource,
          gumroad_last_event_at: receivedAt,
          updated_at: receivedAt
        };
        if (resource === 'sale' || resource === 'subscription_restarted' || resource === 'subscription_updated' || resource === 'dispute_won') {
          updates.last_payment_at = receivedAt;
        }
        const { error: updateError } = await supabase.from('websites').update(updates).eq('slug', matched.slug);
        if (updateError) throw updateError;
        action = `matched_${product.key}_${statusUpdate.subscription_status}`;
      }
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
      matched_plan: product?.key || null,
      action_taken: action,
      payload: safePayload,
      processed_at: receivedAt
    }, { onConflict: 'event_key' });

    return NextResponse.json({ ok: true, action, matchedSlug: matched?.slug || null });
  } catch (error) {
    console.error('[gumroad-webhook] processing failed', { resource: resourceFromQuery || 'unknown', message: error?.message || String(error) });
    // Return 200 so Gumroad does not keep retrying a malformed event forever.
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('gumroad_events').insert({
        event_key: `error:${Date.now()}`,
        resource_name: resourceFromQuery || 'unknown',
        action_taken: `error:${error.message}`,
        payload: sanitizeGumroadPayload(payload || {}),
        processed_at: new Date().toISOString()
      });
    } catch {}
    return NextResponse.json({ ok: false, error: 'Webhook event could not be processed.' }, { status: 200 });
  }
}
