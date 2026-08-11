import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { slugify } from '../../../../lib/siteDefaults';
import { validateSiteMedia } from '../../../../lib/mediaValidation.mjs';
import {
  GUEST_DRAFT_CLAIM_MAX_AGE_MS,
  guestDraftClaimSecretHash,
  guestDraftClaimSecretMatches,
  guestDraftClaimState,
  newGuestDraftClaimSecret,
  normalizeGuestDraftClaimId,
  normalizeGuestDraftClaimSecret
} from '../../../../lib/guestDraftClaim.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeGuestDraft(site = {}) {
  if (!site || typeof site !== 'object' || Array.isArray(site)) return null;
  const serialized = JSON.stringify(site);
  if (serialized.length > 800_000) return null;
  const media = validateSiteMedia(site);
  if (!media.ok) return null;
  const slug = slugify(site.slug || site.draftName || site.businessName || 'my-website') || 'my-website';
  return {
    slug,
    site: {
      ...site,
      slug,
      status: 'draft',
      guestDraftVersion: 1,
      guestDraftUpdatedAt: new Date().toISOString()
    }
  };
}

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'guest-draft-save', limit: 40, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a few minutes before saving this browser draft again. Your local copy is still safe.');

    const body = await request.json().catch(() => ({}));
    const draft = safeGuestDraft(body.site || body.draft);
    if (!draft) {
      return NextResponse.json({ ok: false, error: 'This browser draft could not be prepared for secure account transfer. Your local copy is unchanged.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const claimId = normalizeGuestDraftClaimId(body.claimId);
    const claimSecret = normalizeGuestDraftClaimSecret(body.claimToken);
    if (claimId && claimSecret) {
      const { data: existing, error: lookupError } = await supabase
        .from('guest_draft_claims')
        .select('id, token_hash, status, expires_at')
        .eq('id', claimId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      const state = guestDraftClaimState(existing || {});
      if (!state.ok || !guestDraftClaimSecretMatches(claimSecret, existing?.token_hash)) {
        return NextResponse.json({ ok: false, error: 'This temporary draft transfer expired or is invalid. Your browser draft remains available.' }, { status: 410 });
      }
      const { data: updated, error: updateError } = await supabase
        .from('guest_draft_claims')
        .update({ draft_slug: draft.slug, site: draft.site, updated_at: new Date().toISOString() })
        .eq('id', claimId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return NextResponse.json({ ok: false, error: 'This temporary draft is already being transferred. Your browser copy is unchanged.' }, { status: 409 });
      return NextResponse.json({ ok: true, claimId, claimToken: claimSecret, expiresAt: existing.expires_at }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const token = newGuestDraftClaimSecret();
    const expiresAt = new Date(Date.now() + GUEST_DRAFT_CLAIM_MAX_AGE_MS).toISOString();
    const { data, error } = await supabase
      .from('guest_draft_claims')
      .insert({
        token_hash: guestDraftClaimSecretHash(token),
        draft_slug: draft.slug,
        site: draft.site,
        status: 'pending',
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .select('id, expires_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, claimId: data.id, claimToken: token, expiresAt: data.expires_at }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[guest-draft] temporary save failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'We could not prepare this draft for account transfer. It remains saved in this browser.' }, { status: 500 });
  }
}
