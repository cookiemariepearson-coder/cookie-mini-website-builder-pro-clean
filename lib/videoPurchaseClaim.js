import { getSupabaseAdmin } from './supabaseAdmin';

export function validPurchaseNamespace(value = '') {
  return /^standalone-[a-f0-9]{24}$/.test(String(value || ''));
}

function validOwnerId(value = '') {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(value || ''));
}

export async function ownerHasStandalonePurchase(ownerId, namespace, client = null) {
  if (!validOwnerId(ownerId) || !validPurchaseNamespace(namespace)) return false;
  const supabase = client || getSupabaseAdmin();
  const { data, error } = await supabase
    .from('ai_video_purchase_claims')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('purchase_namespace', namespace)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function latestStandalonePurchase(ownerId, client = null) {
  if (!validOwnerId(ownerId)) return null;
  const supabase = client || getSupabaseAdmin();
  const { data, error } = await supabase
    .from('ai_video_purchase_claims')
    .select('purchase_namespace')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return validPurchaseNamespace(data?.purchase_namespace) ? data.purchase_namespace : null;
}

export async function claimStandalonePurchase({ ownerId, namespace, purchaseEmailHash, client = null }) {
  if (!validOwnerId(ownerId) || !validPurchaseNamespace(namespace) || !/^[a-f0-9]{64}$/.test(String(purchaseEmailHash || ''))) {
    return { ok: false, reason: 'invalid' };
  }
  const supabase = client || getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('ai_video_purchase_claims')
    .select('owner_id')
    .eq('purchase_namespace', namespace)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return String(existing.owner_id) === String(ownerId)
    ? { ok: true, alreadyClaimed: true }
    : { ok: false, reason: 'owned' };

  const { error: insertError } = await supabase.from('ai_video_purchase_claims').insert({
    owner_id: ownerId,
    purchase_namespace: namespace,
    purchase_email_hash: purchaseEmailHash
  });
  if (!insertError) return { ok: true, alreadyClaimed: false };

  // A concurrent request may win the unique insert. Re-read and allow only the same owner.
  const { data: winner, error: winnerError } = await supabase
    .from('ai_video_purchase_claims')
    .select('owner_id')
    .eq('purchase_namespace', namespace)
    .maybeSingle();
  if (winnerError) throw winnerError;
  if (winner && String(winner.owner_id) === String(ownerId)) return { ok: true, alreadyClaimed: true };
  if (winner) return { ok: false, reason: 'owned' };
  throw insertError;
}
