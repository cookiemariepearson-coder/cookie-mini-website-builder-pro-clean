import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import {
  claimGumroadEvent,
  failClaimedGumroadEvent,
  processClaimedGumroadEvent
} from '../../../../lib/gumroadSubscriptionService.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUPPORTED_RESOURCES = new Set(['sale', 'refund', 'cancellation', 'subscription_ended', 'subscription_restarted', 'subscription_updated', 'dispute', 'dispute_won']);

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

function safeEqual(left = '', right = '') {
  const first = Buffer.from(String(left));
  const second = Buffer.from(String(right));
  return first.length === second.length && timingSafeEqual(first, second);
}

function isAuthorizedWebhook(request) {
  const expected = String(process.env.GUMROAD_WEBHOOK_SECRET || '').trim();
  const provided = new URL(request.url).searchParams.get('token') || '';
  return Boolean(expected) && safeEqual(provided, expected);
}

async function parseRequest(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return request.json();
  const payload = {};
  const params = new URLSearchParams(await request.text());
  for (const [key, value] of params.entries()) payload[key] = value;
  return payload;
}

export async function POST(request) {
  if (!isAuthorizedWebhook(request)) {
    return privateResponse({ ok: false, error: 'Unauthorized webhook.' }, 401);
  }

  const receivedAt = new Date().toISOString();
  const resourceFromQuery = new URL(request.url).searchParams.get('resource') || '';
  let claim = null;
  try {
    const payload = await parseRequest(request);
    const payloadResource = String(payload.resource_name || payload.resource || payload.event || '').trim().toLowerCase();
    const queryResource = String(resourceFromQuery).trim().toLowerCase();
    if (payloadResource && queryResource && payloadResource !== queryResource) {
      throw Object.assign(new Error('resource_identity_mismatch'), { code: 'resource_identity_mismatch' });
    }
    const resource = payloadResource || queryResource || 'sale';
    if (!SUPPORTED_RESOURCES.has(resource)) {
      throw Object.assign(new Error('unsupported_resource'), { code: 'unsupported_resource' });
    }
    const supabase = getSupabaseAdmin();
    claim = await claimGumroadEvent(supabase, { resource, payload, receivedAt });
    if (!claim.claimed) {
      return privateResponse({
        ok: true,
        duplicate: true,
        action: claim.event?.action_taken || 'duplicate_ignored',
        matchedSlug: claim.event?.matched_slug || null
      });
    }
    const result = await processClaimedGumroadEvent({
      supabase,
      event: claim.event,
      payload,
      receivedAt
    });
    return privateResponse({ ok: true, ...result });
  } catch (error) {
    const code = String(error?.code || 'processing_failed').slice(0, 100);
    console.error('[gumroad-webhook] processing failed', { resource: resourceFromQuery || 'unknown', code });
    if (claim?.event?.id) {
      try { await failClaimedGumroadEvent(getSupabaseAdmin(), claim.event.id, error); } catch {}
    }
    return privateResponse({ ok: false, error: 'Webhook event could not be processed.' }, 500);
  }
}
