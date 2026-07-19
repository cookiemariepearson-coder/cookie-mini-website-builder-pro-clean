import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanText(value, fallback = '', max = 1200) {
  return String(value || fallback).replace(/[<>]/g, '').trim().slice(0, max);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function normalizePlan(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('premium')) return 'premium';
  if (raw.includes('business')) return 'business';
  if (raw.includes('starter')) return 'starter';
  if (raw.includes('free')) return 'free';
  return 'free';
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

function planLimit(plan) {
  const limits = {
    free: 0,
    starter: Number(process.env.HEYGEN_STARTER_MONTHLY_LIMIT || 0),
    business: Number(process.env.HEYGEN_BUSINESS_MONTHLY_LIMIT || 1),
    premium: Number(process.env.HEYGEN_PREMIUM_MONTHLY_LIMIT || 3)
  };
  return Number.isFinite(limits[plan]) ? limits[plan] : 0;
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

async function findWebsite({ email, slug }) {
  if (slug) {
    const result = await supabaseGet(`websites?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    if (result.missing) return { missingSupabase: true };
    if (result.ok && Array.isArray(result.data) && result.data.length) return { website: result.data[0] };
  }

  if (email) {
    const result = await supabaseGet(`websites?email=eq.${encodeURIComponent(email)}&select=*&order=updated_at.desc&limit=10`);
    if (result.missing) return { missingSupabase: true };
    if (result.ok && Array.isArray(result.data) && result.data.length) {
      return { website: result.data.find((row) => row.status === 'published') || result.data[0] };
    }
  }

  return { website: null };
}

function getSiteObject(row) {
  if (!row) return {};
  if (row.site && typeof row.site === 'object') return row.site;
  if (typeof row.site === 'string') {
    try { return JSON.parse(row.site); } catch { return {}; }
  }
  return {};
}

function getWebsitePlan(row) {
  const site = getSiteObject(row);
  return normalizePlan(row?.plan || row?.billing_plan || row?.subscription_plan || site.plan || site.selectedPlan || site.packageName || site.package || 'free');
}

function getWebsiteStatus(row) {
  const site = getSiteObject(row);
  return String(row?.status || site.status || 'draft').toLowerCase();
}

async function checkCustomerAccess(body) {
  const requiredCode = process.env.HEYGEN_VIDEO_ACCESS_CODE || process.env.ADMIN_PIN || '';
  const providedCode = String(body.accessCode || '').trim();
  const ownerOverride = Boolean(requiredCode && providedCode === String(requiredCode).trim());
  if (ownerOverride) {
    return { ok: true, ownerOverride: true, plan: 'owner', limit: 9999, used: 0, remaining: 9999, website: null };
  }

  const email = getEmail(body.customerEmail || body.email || body.accountEmail || '');
  const slug = normalizeSlug(body.websiteSlug || body.slug || body.websiteName || body.subdomain || '');

  if (!email && !slug) {
    return {
      ok: false,
      status: 401,
      error: 'Enter the customer email or website/subdomain connected to an active Business or Premium plan. Free and Starter plans use creative kit mode only.'
    };
  }

  const lookup = await findWebsite({ email, slug });
  if (lookup.missingSupabase) {
    return { ok: false, status: 500, error: 'Supabase is not connected for AI video plan limits.' };
  }
  const website = lookup.website;
  if (!website) {
    return { ok: false, status: 404, error: 'No customer website or draft was found for that email/subdomain.' };
  }

  const status = getWebsiteStatus(website);
  if (['paused', 'archived', 'deleted', 'inactive'].includes(status)) {
    return { ok: false, status: 403, error: `This website is ${status}. AI video generation is locked until the plan is active.` };
  }

  const plan = getWebsitePlan(website);
  const baseLimit = planLimit(plan);
  const bonus = Number(website.video_bonus_credits || 0);
  const currentMonth = monthKey();
  const used = website.video_month_key === currentMonth ? Number(website.video_usage_month || 0) : 0;
  const totalLimit = Math.max(0, baseLimit + bonus);
  const remaining = Math.max(0, totalLimit - used);

  if (totalLimit <= 0) {
    return { ok: false, status: 403, plan, used, limit: totalLimit, remaining: 0, error: 'Real HeyGen video is not included with this plan. Use the creative kit, or upgrade to Business or Premium.' };
  }
  if (remaining <= 0) {
    return { ok: false, status: 403, plan, used, limit: totalLimit, remaining: 0, error: `This ${plan} plan has used all real AI video credits for ${currentMonth}.` };
  }

  return { ok: true, ownerOverride: false, website, plan, used, limit: totalLimit, remaining, month: currentMonth };
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
    customer_email: email || access.website?.email || access.website?.customer_email || null,
    website_slug: slug || access.website?.slug || null,
    business_name: cleanText(body.businessName, 'Your Business', 160),
    prompt,
    status: heygenPayload.status || 'generating',
    heygen_session_id: sessionId,
    heygen_video_id: videoId,
    video_type: cleanText(body.videoType, 'Business Promo', 120),
    platform: cleanText(body.platform, 'TikTok / Reels', 120),
    owner_override: Boolean(access.ownerOverride),
    plan: access.plan || null,
    raw_response: heygenPayload
  };
  try {
    const inserted = await supabasePost('heygen_video_jobs', row);
    if (inserted.ok && Array.isArray(inserted.data) && inserted.data[0]) return inserted.data[0];
  } catch {}
  return null;
}

export async function POST(request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'HEYGEN_API_KEY is missing in Vercel Environment Variables.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const access = await checkCustomerAccess(body);
    if (!access.ok) {
      return NextResponse.json({ ok: false, ...access }, { status: access.status || 403 });
    }

    const prompt = buildHeyGenPrompt(body);

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
      return NextResponse.json({
        ok: false,
        error: data?.error?.message || data?.message || 'HeyGen video request failed.',
        detail: data
      }, { status: heygenResponse.status });
    }

    const payload = data?.data || data || {};
    const usageUpdate = await incrementUsage(access, payload);
    const sessionId = payload.session_id || payload.sessionId || null;
    const videoId = payload.video_id || payload.videoId || null;
    const savedJob = await saveVideoJob(access, body, payload, prompt);
    const nextUsed = access.ownerOverride ? 0 : (access.used + 1);
    const nextRemaining = access.ownerOverride ? 9999 : Math.max(0, access.limit - nextUsed);

    return NextResponse.json({
      ok: true,
      status: payload.status || 'generating',
      sessionId,
      videoId,
      jobId: savedJob?.id || null,
      prompt,
      plan: access.plan,
      ownerOverride: access.ownerOverride,
      videoUsage: {
        used: nextUsed,
        limit: access.limit,
        remaining: nextRemaining,
        month: monthKey()
      },
      usageWarning: usageUpdate.ok ? null : 'Video was sent to HeyGen, but usage tracking could not be updated. Run the Supabase AI video migration if needed.',
      resultsDashboard: '/video-studio/results',
      heygenSessionUrl: sessionId ? `https://app.heygen.com/video-agent/${sessionId}` : null,
      raw: data
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unexpected HeyGen create error.' }, { status: 500 });
  }
}
