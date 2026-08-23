import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WEBSITE_CHECKOUTS, cleanCheckoutUrl } from './commerceConfig.mjs';
import { getSupabaseAdmin } from './supabaseAdmin';
import { normalizeWebsiteCheckoutIntentId } from './websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

const planLabels = {
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
};

export { cleanCheckoutUrl };

export default async function CheckoutRedirectPage({ plan, intentId = '' }) {
  const config = WEBSITE_CHECKOUTS[plan];
  const rawUrl = config ? process.env[config.envName] : '';
  let url = cleanCheckoutUrl(rawUrl);

  const normalizedIntentId = normalizeWebsiteCheckoutIntentId(intentId);
  if (url && !normalizedIntentId) url = '';
  if (url) {
    const supabase = getSupabaseAdmin();
    const { data: intent } = await supabase.from('website_checkout_intents')
      .select('id,plan,status,website_id,draft_slug')
      .eq('id', normalizedIntentId)
      .maybeSingle();
    if (!intent || intent.plan !== plan || intent.status !== 'checkout_started' || !intent.website_id) url = '';
    if (url) {
      const { data: website } = await supabase.from('websites').select('id,slug,plan').eq('id', intent.website_id).maybeSingle();
      const websitePlanMatches = plan === 'extra' ? ['starter', 'business'].includes(website?.plan) : website?.plan === plan;
      if (!website || !websitePlanMatches || website.slug !== intent.draft_slug) url = '';
      else {
        const checkout = new URL(url);
        checkout.searchParams.set('wanted', 'true');
        checkout.searchParams.set('Website name or subdomain', website.slug);
        checkout.searchParams.set('Checkout reference', intent.id);
        url = checkout.toString();
      }
    }
  }

  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    redirect(url);
  }

  console.error('[checkout] checkout URL missing or invalid', { plan, environmentVariable: config?.envName || 'UNKNOWN_WEBSITE_CHECKOUT' });

  return (
    <main className="wrap dashboard">
      <span className="kicker">Checkout setup needed</span>
      <h1>{planLabels[plan] || 'Checkout'} link is missing.</h1>
      <p>The checkout button is working, but this project does not have a valid Gumroad URL saved for this plan yet.</p>
      <div className="notice error">Secure checkout is temporarily unavailable. Your draft and plan selection have not been lost. Please try again shortly or contact support.</div>
      <p>
        <Link className="btn" href="/pricing">Back to Pricing</Link>{' '}
        <Link className="btn dark" href="/builder">Back to Builder</Link>
      </p>
    </main>
  );
}
