import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WEBSITE_CHECKOUTS, cleanCheckoutUrl } from './commerceConfig.mjs';

export const dynamic = 'force-dynamic';

const planLabels = {
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
};

export { cleanCheckoutUrl };

export default function CheckoutRedirectPage({ plan }) {
  const config = WEBSITE_CHECKOUTS[plan];
  const rawUrl = config ? process.env[config.envName] : '';
  const url = cleanCheckoutUrl(rawUrl);

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
