import {
  identifyWebsiteProduct,
  sanitizeGumroadPayload
} from './gumroadWebsiteProducts.mjs';
import {
  authoritativeSubscriptionTransition,
  maskCustomerIdentifier,
  providerCustomerEmail,
  providerEventAt,
  providerEventReference,
  providerSaleId,
  providerSubscriptionId,
  providerWebsiteSlug,
  transitionWebsiteUpdates,
  validProviderDate,
  webhookSubscriptionTransition,
  websitePlanAccess
} from './subscriptionLifecycle.mjs';
import { fetchGumroadSubscriptionEvidence } from './gumroadSubscriptionApi.mjs';

const clean = (value = '') => String(value || '').trim();
const lower = (value = '') => clean(value).toLowerCase();

function ownerEmail(website = {}) {
  return lower(website.customer_email || website.site?.customerEmail || website.email);
}

function eventReview(reason = '') {
  if (reason.includes('product')) return 'Confirm the event belongs to an approved Mini Builder subscription product.';
  if (reason.includes('email') || reason.includes('owner')) return 'Verify the Gumroad customer and the saved website owner match.';
  if (reason.includes('website') || reason.includes('identity') || reason.includes('matching')) return 'Check the verified website name on the Gumroad purchase, then recheck.';
  if (reason.includes('refund') || reason.includes('dispute') || reason.includes('reconciliation')) return 'Run a read-only recheck, then reconcile only if the provider record matches.';
  if (reason.includes('older') || reason.includes('restart')) return 'Run a read-only recheck before applying any older or conflicting event.';
  return 'Leave unresolved until the provider record can be verified safely.';
}

async function findBySubscriptionId(supabase, subscriptionId) {
  if (!subscriptionId) return null;
  const { data: base, error: baseError } = await supabase.from('websites').select('*').eq('gumroad_subscription_id', subscriptionId).maybeSingle();
  if (baseError) throw baseError;
  if (base) return base;
  const { data: extra, error: extraError } = await supabase.from('websites').select('*').eq('extra_page_gumroad_subscription_id', subscriptionId).maybeSingle();
  if (extraError) throw extraError;
  return extra || null;
}

async function findWebsite(supabase, { subscriptionId = '', slug = '' } = {}) {
  const bySubscription = await findBySubscriptionId(supabase, subscriptionId);
  if (bySubscription) return bySubscription;
  if (!slug) return null;
  const { data, error } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data || null;
}

function eventRecord({ resource, payload, receivedAt }) {
  const safePayload = sanitizeGumroadPayload(payload);
  const resourceName = lower(resource || payload.resource_name || payload.resource || payload.event || 'sale');
  const websiteReference = providerWebsiteSlug(payload);
  if (websiteReference) safePayload.website_reference = websiteReference;
  return {
    event_key: providerEventReference(resourceName, payload),
    provider_event_id: providerEventReference(resourceName, payload),
    resource_name: resourceName,
    event_category: resourceName,
    email: providerCustomerEmail(payload) || null,
    sale_id: providerSaleId(payload) || null,
    subscription_id: providerSubscriptionId(payload) || null,
    product_id: clean(payload.product_id || payload.product_permalink || payload.permalink) || null,
    product_name: clean(payload.product_name || payload.product_title || payload.name || payload.product || payload.product_permalink || payload.permalink).slice(0, 250) || null,
    matched_slug: websiteReference || null,
    provider_event_at: providerEventAt(resourceName, payload, receivedAt),
    received_at: receivedAt,
    processed_at: receivedAt,
    processing_status: 'processing',
    review_status: 'unresolved',
    payload: safePayload
  };
}

export async function claimGumroadEvent(supabase, input) {
  const record = eventRecord(input);
  const { data, error } = await supabase.from('gumroad_events').insert(record).select('*').single();
  if (!error) return { claimed: true, duplicate: false, event: data, payload: input.payload };
  if (error.code !== '23505') throw error;

  const { data: prior, error: priorError } = await supabase.from('gumroad_events').select('*').eq('event_key', record.event_key).maybeSingle();
  if (priorError) throw priorError;
  if (!prior) throw error;
  if (prior.processing_status !== 'failed') return { claimed: false, duplicate: true, event: prior, payload: input.payload };
  const { data: retried, error: retryError } = await supabase
    .from('gumroad_events')
    .update({ processing_status: 'processing', retry_count: Math.max(0, Number(prior.retry_count) || 0) + 1, processed_at: input.receivedAt })
    .eq('id', prior.id)
    .eq('processing_status', 'failed')
    .select('*')
    .maybeSingle();
  if (retryError) throw retryError;
  return retried
    ? { claimed: true, duplicate: false, event: retried, payload: input.payload }
    : { claimed: false, duplicate: true, event: prior, payload: input.payload };
}

async function updateEvent(supabase, eventId, updates) {
  const { error } = await supabase.from('gumroad_events').update({ ...updates, processed_at: new Date().toISOString() }).eq('id', eventId);
  if (error) throw error;
}

function isOlder(current, incoming) {
  const currentDate = validProviderDate(current);
  const incomingDate = validProviderDate(incoming);
  return Boolean(currentDate && incomingDate && new Date(incomingDate).getTime() < new Date(currentDate).getTime());
}

async function applyWithCompareAndSet({ supabase, website, product, payload, transition, extraPage, receivedAt, resource = '' }) {
  const stateField = extraPage ? 'extra_page_state_event_at' : 'subscription_state_event_at';
  let current = website;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (isOlder(current[stateField], transition.eventAt)) {
      return { applied: false, website: current, reason: 'older_than_current_verified_state' };
    }
    const updates = transitionWebsiteUpdates(current, transition, { extraPage, product, payload, receivedAt });
    if (!extraPage) {
      const eventResource = lower(resource || payload.resource_name || payload.resource || payload.event || 'reconciled');
      updates.payment_provider = 'gumroad';
      updates.gumroad_email = providerCustomerEmail(payload) || current.gumroad_email || null;
      updates.gumroad_last_event = eventResource;
      updates.gumroad_last_event_key = providerEventReference(eventResource, payload);
    }
    let query = supabase.from('websites').update(updates).eq('id', current.id);
    query = current[stateField] ? query.eq(stateField, current[stateField]) : query.is(stateField, null);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw error;
    if (data) return { applied: true, website: data, reason: transition.reason };
    const { data: latest, error: latestError } = await supabase.from('websites').select('*').eq('id', current.id).maybeSingle();
    if (latestError) throw latestError;
    if (!latest) return { applied: false, website: current, reason: 'website_missing_during_update' };
    current = latest;
  }
  return { applied: false, website: current, reason: 'concurrent_update_requires_recheck' };
}

function exactEmailMatches(website, eventEmail) {
  return Boolean(eventEmail && ownerEmail(website) && eventEmail === ownerEmail(website));
}

export async function processClaimedGumroadEvent({ supabase, event, payload, receivedAt = new Date().toISOString() }) {
  const product = identifyWebsiteProduct(payload);
  if (!product) {
    const reason = 'unmatched_or_unapproved_product';
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
      safe_action: eventReview(reason), action_taken: reason, matched_plan: null
    });
    return { action: reason, matchedSlug: null, review: true };
  }

  const subscriptionId = providerSubscriptionId(payload);
  const slug = providerWebsiteSlug(payload);
  const website = await findWebsite(supabase, { subscriptionId, slug });
  if (!website) {
    const reason = !subscriptionId && !slug ? 'unmatched_missing_website_identity' : 'unmatched_no_matching_website';
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
      safe_action: eventReview(reason), action_taken: reason, matched_plan: product.key
    });
    return { action: reason, matchedSlug: null, review: true };
  }

  if (slug && slug !== website.slug) {
    const reason = 'unmatched_subscription_and_website_identity_conflict';
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
      safe_action: eventReview(reason), action_taken: reason, matched_slug: null, matched_plan: product.key
    });
    return { action: reason, matchedSlug: null, review: true };
  }

  const eventEmail = providerCustomerEmail(payload);
  if (!exactEmailMatches(website, eventEmail)) {
    const reason = 'unmatched_verified_owner_email_mismatch';
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
      safe_action: eventReview(reason), action_taken: reason, matched_slug: null, matched_plan: product.key
    });
    return { action: reason, matchedSlug: null, review: true };
  }

  const extraPage = product.plan === 'extra_page';
  const storedSubscriptionId = clean(extraPage ? website.extra_page_gumroad_subscription_id : website.gumroad_subscription_id);
  const storedProductId = clean(extraPage ? website.extra_page_gumroad_product_id : website.gumroad_product_id);
  if ((storedSubscriptionId && subscriptionId && storedSubscriptionId !== subscriptionId) ||
      (storedProductId && storedProductId !== product.productId && event.resource_name !== 'subscription_updated')) {
    const reason = 'unmatched_existing_subscription_identity_conflict';
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
      safe_action: eventReview(reason), action_taken: reason, matched_slug: null, matched_plan: product.key
    });
    return { action: reason, matchedSlug: null, review: true };
  }
  if (extraPage) {
    const baseAccess = websitePlanAccess(website, { now: receivedAt });
    if (!baseAccess.active || !['starter', 'business'].includes(lower(website.plan))) {
      const reason = 'unmatched_extra_page_requires_active_eligible_website';
      await updateEvent(supabase, event.id, {
        processing_status: 'processed', review_status: 'unresolved', review_reason: reason,
        safe_action: eventReview(reason), action_taken: reason, matched_slug: null, matched_plan: product.key
      });
      return { action: reason, matchedSlug: null, review: true };
    }
  }

  const transition = webhookSubscriptionTransition({ resource: event.resource_name, payload, existing: website, receivedAt, extraPage });
  if (!transition.apply) {
    await updateEvent(supabase, event.id, {
      processing_status: 'processed', review_status: 'unresolved', review_reason: transition.reason,
      safe_action: eventReview(transition.reason), action_taken: transition.reason,
      matched_slug: website.slug, matched_plan: product.key
    });
    return { action: transition.reason, matchedSlug: website.slug, review: true };
  }

  const result = await applyWithCompareAndSet({
    supabase,
    website,
    product,
    payload,
    transition,
    extraPage,
    receivedAt,
    resource: event.resource_name
  });
  const reviewStatus = transition.review || !result.applied ? 'unresolved' : 'resolved';
  const reason = result.applied ? transition.reason : result.reason;
  await updateEvent(supabase, event.id, {
    processing_status: 'processed', review_status: reviewStatus, review_reason: reviewStatus === 'resolved' ? null : reason,
    safe_action: reviewStatus === 'resolved' ? 'No action required.' : eventReview(reason),
    action_taken: result.applied ? `matched_${product.key}_${transition.state}` : reason,
    matched_slug: website.slug, matched_plan: product.key, applied: result.applied
  });
  return { action: result.applied ? `matched_${product.key}_${transition.state}` : reason, matchedSlug: website.slug, review: reviewStatus !== 'resolved' };
}

export async function failClaimedGumroadEvent(supabase, eventId, error) {
  const code = clean(error?.code || 'processing_failed').slice(0, 100);
  await updateEvent(supabase, eventId, {
    processing_status: 'failed', review_status: 'unresolved', review_reason: code,
    error_code: code, safe_action: 'Retry after the processing error is resolved.', action_taken: 'processing_failed'
  });
}

function evidenceProductPayload(event, evidence) {
  const productId = clean(evidence.subscriber?.product_id || evidence.sale?.product_id || event.product_id);
  return {
    ...(event.payload || {}),
    resource_name: event.resource_name,
    product_id: productId,
    product_name: evidence.subscriber?.product_name || evidence.sale?.product_name || event.product_name,
    sale_id: evidence.sale?.id || event.sale_id,
    subscription_id: evidence.subscriber?.id || evidence.sale?.subscription_id || event.subscription_id,
    user_email: evidence.subscriber?.email || evidence.sale?.email || event.email
  };
}

export async function reconcileGumroadEvent({ supabase, eventId, apply = false, accessToken, adminId = null, fetchImpl = fetch }) {
  const { data: event, error } = await supabase.from('gumroad_events').select('*').eq('id', eventId).maybeSingle();
  if (error) throw error;
  if (!event) return { ok: false, status: 404, error: 'Event not found.' };
  if (apply && event.reconciliation_source !== 'gumroad_api_preview') {
    return { ok: false, status: 409, error: 'Run Recheck before applying reconciliation.' };
  }

  const evidence = await fetchGumroadSubscriptionEvidence({
    subscriptionId: event.subscription_id,
    saleId: event.sale_id,
    accessToken,
    fetchImpl
  });
  const payload = evidenceProductPayload(event, evidence);
  const product = identifyWebsiteProduct(payload);
  const evidenceEmails = [evidence.subscriber?.email, evidence.sale?.email].filter(Boolean);
  const productIds = [evidence.subscriber?.product_id, evidence.sale?.product_id].filter(Boolean);
  const subscriptionIds = [event.subscription_id, evidence.subscriber?.id, evidence.sale?.subscription_id].filter(Boolean);
  const saleIds = [event.sale_id, evidence.sale?.id].filter(Boolean);
  if (!product || new Set(productIds).size > 1 || new Set(evidenceEmails).size > 1 || new Set(subscriptionIds).size > 1 || new Set(saleIds).size > 1) {
    const reason = 'authoritative_product_or_customer_conflict';
    await updateEvent(supabase, event.id, { last_reconciled_at: new Date().toISOString(), review_reason: reason, safe_action: eventReview(reason) });
    return { ok: true, resolved: false, preview: !apply, reason, recommendedAction: eventReview(reason) };
  }

  const website = await findWebsite(supabase, {
    subscriptionId: providerSubscriptionId(payload),
    slug: providerWebsiteSlug(payload) || event.matched_slug || ''
  });
  const verifiedEmail = providerCustomerEmail(payload);
  if (!website || !exactEmailMatches(website, verifiedEmail)) {
    const reason = website ? 'authoritative_owner_email_mismatch' : 'authoritative_website_not_matched';
    await updateEvent(supabase, event.id, { last_reconciled_at: new Date().toISOString(), review_reason: reason, safe_action: eventReview(reason) });
    return { ok: true, resolved: false, preview: !apply, reason, recommendedAction: eventReview(reason) };
  }

  const extraPage = product.plan === 'extra_page';
  const transition = authoritativeSubscriptionTransition({ subscriber: evidence.subscriber, sale: evidence.sale, existing: website, extraPage });
  transition.saleId = providerSaleId(payload);
  transition.subscriptionId = providerSubscriptionId(payload);
  if (!transition.apply) {
    await updateEvent(supabase, event.id, { last_reconciled_at: new Date().toISOString(), review_reason: transition.reason, safe_action: eventReview(transition.reason) });
    return { ok: true, resolved: false, preview: !apply, reason: transition.reason, recommendedAction: eventReview(transition.reason) };
  }

  if (!apply) {
    await updateEvent(supabase, event.id, {
      last_reconciled_at: new Date().toISOString(), reconciliation_source: 'gumroad_api_preview',
      review_reason: transition.reason, safe_action: 'Provider match verified. Reconcile may now apply this state safely.'
    });
    return {
      ok: true, resolved: true, preview: true, state: transition.state, access: transition.active ? 'active' : 'paused',
      website: website.slug, recommendedAction: 'Provider match verified. Reconcile may now apply this state safely.'
    };
  }

  const applied = await applyWithCompareAndSet({
    supabase, website, product, payload, transition, extraPage,
    receivedAt: new Date().toISOString(), resource: event.resource_name
  });
  const resolved = applied.applied || applied.reason === 'older_than_current_verified_state';
  await updateEvent(supabase, event.id, {
    last_reconciled_at: new Date().toISOString(), reconciliation_source: 'gumroad_api',
    review_status: resolved ? 'resolved' : 'unresolved', review_reason: resolved ? null : applied.reason,
    safe_action: resolved ? 'No action required.' : eventReview(applied.reason),
    action_taken: resolved ? `reconciled_${product.key}_${transition.state}` : applied.reason,
    matched_slug: website.slug, matched_plan: product.key, applied: applied.applied,
    reviewed_at: new Date().toISOString(), reviewed_by: adminId
  });
  return { ok: true, resolved, preview: false, state: transition.state, access: transition.active ? 'active' : 'paused', website: website.slug, reason: applied.reason };
}

export async function reviewGumroadEvent({ supabase, eventId, action, note = '', adminId = null }) {
  const safeNote = clean(note).slice(0, 1000);
  const updates = { reviewed_at: new Date().toISOString(), reviewed_by: adminId };
  if (action === 'mark_reviewed') {
    updates.review_status = 'reviewed';
    updates.safe_action = 'Reviewed; no additional access change was made.';
  } else if (action === 'leave_unresolved') {
    updates.review_status = 'unresolved';
    updates.safe_action = 'Left unresolved; no access was granted.';
  } else if (action === 'add_note') {
    if (!safeNote) return { ok: false, status: 400, error: 'Add a short internal note.' };
    updates.internal_note = safeNote;
  } else {
    return { ok: false, status: 400, error: 'Choose a supported review action.' };
  }
  const { data, error } = await supabase.from('gumroad_events').update(updates).eq('id', eventId).select('id,review_status,internal_note,safe_action').maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, status: 404, error: 'Event not found.' };
  return { ok: true, event: data };
}

export function publicEventSummary(event = {}) {
  const rawReference = clean(event.provider_event_id || event.event_key);
  const reference = rawReference ? `${clean(event.event_category || event.resource_name || 'event')}:••••${rawReference.slice(-6)}` : 'Unavailable';
  return {
    id: event.id,
    reference,
    category: event.event_category || event.resource_name || 'unknown',
    product: event.product_name || event.matched_plan || 'Unverified product',
    customer: maskCustomerIdentifier(event.email),
    receivedAt: event.received_at || event.processed_at,
    providerEventAt: event.provider_event_at || null,
    reason: event.review_reason || event.action_taken || 'No review reason recorded.',
    reviewStatus: event.review_status || (event.matched_slug ? 'resolved' : 'unresolved'),
    processingStatus: event.processing_status || 'processed',
    recommendedAction: event.safe_action || eventReview(event.review_reason || event.action_taken || ''),
    website: event.matched_slug || null,
    note: event.internal_note || '',
    lastReconciledAt: event.last_reconciled_at || null,
    canReconcile: Boolean(event.sale_id || event.subscription_id)
  };
}
