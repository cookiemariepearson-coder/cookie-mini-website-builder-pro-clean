import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../../lib/siteOwnerAuth';
import { slugify } from '../../../../../lib/siteDefaults';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import {
  guestDraftClaimSecretMatches,
  guestDraftClaimState,
  normalizeGuestDraftClaimId,
  normalizeGuestDraftClaimSecret
} from '../../../../../lib/guestDraftClaim.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function placeholderSlug(value = '') {
  return ['my-website', 'my-business-name', 'published-website'].includes(String(value || ''));
}

export async function POST(request) {
  let claimId = '';
  let supabase = null;
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const limited = rateLimit(request, { name: 'guest-draft-claim', limit: 12, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before trying to transfer this browser draft again.');

    const body = await request.json().catch(() => ({}));
    claimId = normalizeGuestDraftClaimId(body.claimId);
    const claimSecret = normalizeGuestDraftClaimSecret(body.claimToken);
    if (!claimId || !claimSecret) {
      return NextResponse.json({ ok: false, error: 'The browser draft transfer information is missing. Your local draft has not been removed.' }, { status: 400 });
    }

    supabase = owner.supabase;
    const { data: claim, error: lookupError } = await supabase.from('guest_draft_claims').select('*').eq('id', claimId).maybeSingle();
    if (lookupError) throw lookupError;
    if (claim?.status === 'claimed' && claim.claimed_by === owner.user.id) {
      return NextResponse.json({ ok: true, alreadyClaimed: true, slug: claim.claimed_slug }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const state = guestDraftClaimState(claim || {});
    if (!state.ok || !guestDraftClaimSecretMatches(claimSecret, claim?.token_hash)) {
      return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This temporary transfer expired. The draft remains in the original browser.' : 'This browser draft cannot be attached with the supplied access.' }, { status: state.reason === 'expired' ? 410 : 403 });
    }

    const { data: locked, error: lockError } = await supabase
      .from('guest_draft_claims')
      .update({ status: 'claiming', claimed_by: owner.user.id, updated_at: new Date().toISOString() })
      .eq('id', claimId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (lockError) throw lockError;
    if (!locked) return NextResponse.json({ ok: false, error: 'This draft transfer is already in progress. Refresh My Websites in a moment.' }, { status: 409 });

    const savedSite = claim.site && typeof claim.site === 'object' ? claim.site : {};
    let slug = slugify(claim.draft_slug || savedSite.slug || savedSite.draftName || savedSite.businessName || 'my-website') || 'my-website';
    if (placeholderSlug(slug)) slug = `website-${claimId.slice(0, 8)}`;
    const { data: existing, error: existingError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (existingError) throw existingError;
    if (existing && !siteBelongsToOwner(existing, owner)) {
      await supabase.from('guest_draft_claims').update({ status: 'pending', claimed_by: null, updated_at: new Date().toISOString() }).eq('id', claimId).eq('status', 'claiming');
      return NextResponse.json({ ok: false, error: 'That website name already belongs to another customer. Your browser draft is safe; choose another draft name before transferring it.' }, { status: 409 });
    }
    if (existing && String(existing.status || '').toLowerCase() === 'published') {
      slug = `${slug.slice(0, 51).replace(/-+$/g, '')}-${claimId.slice(0, 8)}`;
    }

    const authoritativePlan = existing?.plan || 'free';
    const protectedSite = {
      ...savedSite,
      slug,
      requestedPlan: savedSite.plan || savedSite.requestedPlan || 'free',
      plan: authoritativePlan,
      customerEmail: owner.email,
      status: 'draft',
      claimedFromGuestAt: new Date().toISOString()
    };
    if (existing && slug === existing.slug) {
      const { error: updateError } = await supabase.from('websites').update({
        owner_id: owner.user.id,
        customer_email: owner.email,
        business_name: protectedSite.businessName || existing.business_name || slug,
        site: protectedSite,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from('websites').insert({
        slug,
        owner_id: owner.user.id,
        customer_email: owner.email,
        business_name: protectedSite.businessName || slug,
        plan: 'free',
        status: 'draft',
        monthly_price: 0,
        site: protectedSite,
        updated_at: new Date().toISOString()
      });
      if (insertError) throw insertError;
    }

    const { error: finishError } = await supabase.from('guest_draft_claims').update({
      status: 'claimed',
      claimed_by: owner.user.id,
      claimed_slug: slug,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', claimId).eq('status', 'claiming').eq('claimed_by', owner.user.id);
    if (finishError) throw finishError;

    return NextResponse.json({ ok: true, slug, message: 'Your browser draft is now saved permanently in My Websites.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (supabase && claimId) {
      try {
        await supabase.from('guest_draft_claims').update({ status: 'pending', claimed_by: null, updated_at: new Date().toISOString() }).eq('id', claimId).eq('status', 'claiming');
      } catch {}
    }
    console.error('[guest-draft] claim failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The browser draft could not be attached right now. Your local recovery copy remains available.' }, { status: 500 });
  }
}
