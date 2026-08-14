import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedAdmin, getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { standaloneVideoSlugFromAccess } from '../../../../lib/videoResultAccess';
import { ownerHasStandalonePurchase } from '../../../../lib/videoPurchaseClaim';
import { configuredVideoLimits, websiteVideoEntitlement } from '../../../../lib/videoEntitlement.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateJson(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  return NextResponse.json(body, { ...init, headers });
}

function cleanText(value, fallback = '', max = 1200) {
  return String(value || fallback).replace(/[<>]/g, '').trim().slice(0, max);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function generationRequestKey(scope = '', requestId = '') {
  const id = String(requestId || '').trim();
  if (!scope || !/^[a-f0-9-]{20,80}$/i.test(id)) return '';
  return crypto.createHash('sha256').update(`${scope}:${id}`).digest('hex');
}

function normalizeSlug(value) {
  let input = String(value || '').trim().toLowerCase();
  if (!input) return '';
  input = input.replace(/^https?:\/\//, '').replace(/^www\./, '');
  input = input.split('?')[0].split('#')[0];
  if (input.includes('/site/')) input = input.split('/site/')[1] || input;
  input = input.split('/')[0] || input;
  const root = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').toLowerCase();
  if (input.endsWith(`.${root}`)) input = input.slice(0, -1 * (`.${root}`).length);
  if (input === root) return '';
  return input.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function buildHeyGenPrompt(input) {
  const biz = cleanText(input.businessName, 'the customer business');
  const promo = cleanText(input.promo, 'their product or service');
  const audience = cleanText(input.audience, 'local customers');
  const videoType = cleanText(input.videoType, 'Business Promo');
  const platform = cleanText(input.platform, 'TikTok / Reels');
  const style = cleanText(input.style, 'Professional');
  const length = cleanText(input.length, '15 seconds');
  const voice = cleanText(input.voice, 'Warm female voice');

  return [
    `Create a ${length} ${videoType} for ${biz}.`,
    `Main promotion: ${promo}.`,
    `Target audience: ${audience}.`,
    `Platform: ${platform}.`,
    `Visual style: ${style}.`,
    `Voice style: ${voice}.`,
    'Create a complete polished marketing video with a presenter or avatar, captions, smooth scene changes, clean branding, and a clear call to action.',
    'Use original generic visuals only. Do not use copyrighted logos, celebrity likenesses, or protected brand assets.',
    'End with a short call to action telling viewers to visit the website or contact the business.'
  ].join('\n');
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

async function supabaseGet(path) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: null };
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(), cache: 'no-store' });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function supabasePatch(path, update) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: null };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(update)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function supabasePost(path, row) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: null };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(row)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function supabaseDelete(path) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true };
  const res = await fetch(`${url}/rest/v1/${path}`, { method: 'DELETE', headers: supabaseHeaders() });
  return { ok: res.ok, status: res.status };
}

async function findWebsite({ email, slug }) {
  if (slug) {
    const result = await supabaseGet(`websites?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    if (result.missing) return { missingSupabase: true };
    if (result.ok && Array.isArray(result.data) && result.data.length) return { website: result.data[0] };
  }

  if (email) {
    const result = await supabaseGet(`websites?customer_email=eq.${encodeURIComponent(email)}&select=*&order=updated_at.desc&limit=10`);
    if (result.missing) return { missingSupabase: true };
    if (result.ok && Array.isArray(result.data) && result.data.length) {
      return { website: result.data.find((row) => row.status === 'published') || result.data[0] };
    }
  }

  return { website: null };
}

async function checkCustomerAccess(request, body) {
  if (body.ownerOverride === true) {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return { ok: false, status: admin.status, error: admin.error };
    const requestKey = generationRequestKey(`owner:${admin.email || 'admin'}`, body.requestId);
    if (!requestKey) return { ok: false, status: 400, error: 'This video request could not be validated. Refresh the page and try again.' };
    return { ok: true, ownerOverride: true, plan: 'owner', limit: 9999, used: 0, remaining: 9999, website: null, requestKey };
  }

  const videoAccess = verifyVideoAccessToken(body.accessToken || '');
  if (videoAccess?.kind === 'standalone') {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return { ok: false, status: owner.status, error: owner.error };
    const usageKey = standaloneVideoSlugFromAccess(videoAccess);
    if (!usageKey || String(videoAccess.ownerId || '') !== String(owner.user.id)) {
      return { ok: false, status: 403, error: 'This video credit does not belong to the signed-in customer.' };
    }
    if (!await ownerHasStandalonePurchase(owner.user.id, usageKey, owner.supabase)) {
      return { ok: false, status: 403, error: 'This video credit is not connected to the signed-in customer.' };
    }
    const customerEmail = owner.email;
    const requestKey = generationRequestKey(usageKey, body.requestId);
    if (!requestKey) return { ok: false, status: 400, error: 'This video request could not be validated. Refresh the page and try again.' };
    const prior = await supabaseGet(`heygen_video_jobs?website_slug=eq.${encodeURIComponent(usageKey)}&select=id,status,request_key&limit=1`);
    if (prior.missing) return { ok: false, status: 500, error: 'Supabase is not connected for standalone video usage.' };
    if (!prior.ok) return { ok: false, status: prior.status || 500, error: 'Standalone video usage could not be checked.' };
    if (Array.isArray(prior.data) && prior.data.length) {
      if (prior.data[0].request_key === requestKey) {
        return { ok: true, existingJob: prior.data[0], plan: 'standalone', used: 1, limit: 1, remaining: 0, usageKey, customerEmail };
      }
      return { ok: false, status: 403, plan: 'standalone', used: 1, limit: 1, remaining: 0, error: 'The real video included with this $5 license has already been used. Open Video Results to watch or download it.' };
    }
    return {
      ok: true,
      ownerOverride: false,
      standalonePass: true,
      plan: 'standalone',
      limit: 1,
      used: 0,
      remaining: 1,
      website: null,
      customerEmail,
      usageKey,
      requestKey
    };
  }

  if (videoAccess?.kind === 'website-plan' && videoAccess.slug && videoAccess.ownerId) {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return { ok: false, status: owner.status, error: owner.error };
    if (String(videoAccess.ownerId) !== String(owner.user.id)) {
      return { ok: false, status: 403, error: 'Re-verify your website plan from your verified owner session.' };
    }
    const lookup = await findWebsite({ email: '', slug: videoAccess.slug });
    if (lookup.missingSupabase) return { ok: false, status: 500, error: 'Supabase is not connected for AI video plan limits.' };
    if (!lookup.website || !siteBelongsToOwner(lookup.website, owner)) {
      return { ok: false, status: 403, error: 'This video pass does not belong to the signed-in website owner.' };
    }
    const website = lookup.website;
    const entitlement = websiteVideoEntitlement(website, { limits: configuredVideoLimits(process.env) });
    if (!entitlement.generationAllowed) {
      return { ok: false, status: 403, plan: entitlement.plan, used: entitlement.used, limit: entitlement.limit, remaining: entitlement.remaining, error: 'This website plan does not have an available active AI video credit.' };
    }
    const requestKey = generationRequestKey(`website:${website.id}`, body.requestId);
    if (!requestKey) return { ok: false, status: 400, error: 'This video request could not be validated. Refresh the page and try again.' };
    return { ok: true, ownerOverride: false, website, plan: entitlement.plan, used: entitlement.used, limit: entitlement.limit, remaining: entitlement.remaining, month: entitlement.month, requestKey };
  }

  return {
    ok: false,
    status: 401,
    error: 'Verify your active website plan from your secure owner session, or use a Gumroad license key.'
  };
}

async function incrementUsage(access, heygenPayload) {
  if (access.ownerOverride || !access.website?.id) return { ok: true, skipped: true };
  const currentMonth = monthKey();
  const used = access.website.video_month_key === currentMonth ? Number(access.website.video_usage_month || 0) : 0;
  const lifetime = Number(access.website.video_lifetime_count || 0);
  return supabasePatch(`websites?id=eq.${encodeURIComponent(access.website.id)}`, {
    video_month_key: currentMonth,
    video_usage_month: used + 1,
    video_lifetime_count: lifetime + 1,
    last_video_at: new Date().toISOString(),
    last_video_status: heygenPayload.status || 'generating',
    last_heygen_session_id: heygenPayload.session_id || heygenPayload.sessionId || null,
    last_heygen_video_id: heygenPayload.video_id || heygenPayload.videoId || null
  });
}


async function saveVideoJob(access, body, heygenPayload, prompt) {
  const sessionId = heygenPayload.session_id || heygenPayload.sessionId || null;
  const videoId = heygenPayload.video_id || heygenPayload.videoId || null;
  const email = getEmail(body.customerEmail || body.email || body.accountEmail || '');
  const slug = normalizeSlug(body.websiteSlug || body.slug || body.websiteName || body.subdomain || '');
  const row = {
    website_id: access.website?.id || null,
    customer_email: access.customerEmail || access.website?.customer_email || access.website?.email || email || null,
    website_slug: access.usageKey || access.website?.slug || slug || null,
    business_name: cleanText(body.businessName, 'Your Business', 160),
    prompt,
    status: heygenPayload.status || 'generating',
    heygen_session_id: sessionId,
    heygen_video_id: videoId,
    video_type: cleanText(body.videoType, 'Business Promo', 120),
    platform: cleanText(body.platform, 'TikTok / Reels', 120),
    owner_override: Boolean(access.ownerOverride),
    plan: access.plan || null,
    raw_response: heygenPayload,
    request_key: access.requestKey || null
  };
  try {
    const inserted = await supabasePost('heygen_video_jobs', row);
    if (inserted.ok && Array.isArray(inserted.data) && inserted.data[0]) return inserted.data[0];
  } catch {}
  return null;
}

async function updateReservedVideoJob(jobId, heygenPayload) {
  const sessionId = heygenPayload.session_id || heygenPayload.sessionId || null;
  const videoId = heygenPayload.video_id || heygenPayload.videoId || null;
  return supabasePatch(`heygen_video_jobs?id=eq.${encodeURIComponent(jobId)}`, {
    status: heygenPayload.status || 'generating',
    heygen_session_id: sessionId,
    heygen_video_id: videoId,
    raw_response: heygenPayload,
    updated_at: new Date().toISOString()
  });
}

function existingGenerationResponse(access, job) {
  return privateJson({
    ok: true,
    status: job?.status || 'processing',
    jobId: job?.id || null,
    plan: access.plan,
    duplicatePrevented: true,
    videoUsage: { used: access.used, limit: access.limit, remaining: access.remaining, month: monthKey() },
    resultsDashboard: '/video-studio/results'
  });
}

export async function POST(request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      console.error('[heygen-create] provider configuration missing');
      return privateJson({ ok: false, error: 'Video generation is temporarily unavailable. Please contact hello@cookiesdigitalcreations.com.' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const access = await checkCustomerAccess(request, body);
    if (!access.ok) {
      return privateJson({ ok: false, ...access }, { status: access.status || 403 });
    }
    if (access.existingJob) return existingGenerationResponse(access, access.existingJob);
    const existingRequest = await supabaseGet(`heygen_video_jobs?request_key=eq.${encodeURIComponent(access.requestKey)}&select=id,status&limit=1`);
    if (existingRequest.ok && Array.isArray(existingRequest.data) && existingRequest.data[0]) {
      return existingGenerationResponse(access, existingRequest.data[0]);
    }
    const limited = rateLimit(request, { name: 'heygen-create', limit: 6, windowMs: 60 * 60 * 1000, subject: access.website?.id || access.usageKey || '' });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before starting another video. A video already in progress can be checked from Video Results.');

    const prompt = buildHeyGenPrompt(body);
    const reservedJob = await saveVideoJob(access, body, { status: 'submitting' }, prompt);
    if (!reservedJob) {
      const concurrent = await supabaseGet(access.standalonePass
        ? `heygen_video_jobs?website_slug=eq.${encodeURIComponent(access.usageKey)}&select=id,status&limit=1`
        : `heygen_video_jobs?request_key=eq.${encodeURIComponent(access.requestKey)}&select=id,status&limit=1`);
      if (concurrent.ok && Array.isArray(concurrent.data) && concurrent.data[0]) return existingGenerationResponse(access, concurrent.data[0]);
      console.error('[heygen-create] generation reservation failed');
      return privateJson({ ok: false, error: 'The video could not be safely queued. No video credit was used; please try again shortly.' }, { status: 503 });
    }

    const heygenResponse = await fetch('https://api.heygen.com/v3/video-agents', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const responseText = await heygenResponse.text();
    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (!heygenResponse.ok) {
      const released = await supabaseDelete(`heygen_video_jobs?id=eq.${encodeURIComponent(reservedJob.id)}`);
      if (!released.ok) console.error('[heygen-create] failed reservation cleanup', { status: released.status || 500 });
      const providerMessage = data?.error?.message || data?.message || '';
      const insufficientCredits = heygenResponse.status === 402 || /insufficient.*credits|credits required/i.test(providerMessage);
      return privateJson({
        ok: false,
        error: insufficientCredits
          ? 'Video generation is temporarily unavailable because the Cookie Digital Creations HeyGen API account needs more provider credits. Your website or standalone video credit was not used. Please try again later or contact hello@cookiesdigitalcreations.com.'
          : 'The video provider could not start this video. Your video credit was not used; please try again shortly.',
        providerCreditRequired: insufficientCredits,
        generationNotStarted: true
      }, { status: insufficientCredits ? 503 : heygenResponse.status });
    }

    const payload = data?.data || data || {};
    const savedJob = await updateReservedVideoJob(reservedJob.id, payload);
    const usageUpdate = await incrementUsage(access, payload);
    const nextUsed = access.ownerOverride ? 0 : (access.used + 1);
    const nextRemaining = access.ownerOverride ? 9999 : Math.max(0, access.limit - nextUsed);

    return privateJson({
      ok: true,
      status: payload.status || 'generating',
      jobId: reservedJob.id,
      plan: access.plan,
      ownerOverride: access.ownerOverride,
      videoUsage: {
        used: nextUsed,
        limit: access.limit,
        remaining: nextRemaining,
        month: monthKey()
      },
      usageWarning: usageUpdate.ok && savedJob.ok ? null : 'Video was accepted by the provider, but one tracking update needs support review. Do not start another video.',
      resultsDashboard: '/video-studio/results'
    });
  } catch (error) {
    console.error('[heygen-create] request failed', { message: error?.message || String(error) });
    return privateJson({ ok: false, error: 'The video could not be started. Your credit was not used; please try again shortly.' }, { status: 500 });
  }
}
