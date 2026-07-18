import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const checkoutMap = {
  starter: process.env.NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL,
  business: process.env.NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL,
  premium: process.env.NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL,
  extra: process.env.NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL
};

const planLabels = {
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
};

const envNames = {
  starter: 'NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL',
  business: 'NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL',
  premium: 'NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL',
  extra: 'NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL'
};

function cleanCheckoutUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim();
  if (!url) return '';

  // Fix the common mistake where the Gumroad URL is pasted without https://
  if (url.startsWith('//')) url = `https:${url}`;
  if (/^(cookiepearson\.gumroad\.com|gumroad\.com)\//i.test(url)) url = `https://${url}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url) && !url.startsWith('http')) url = `https://${url}`;

  // Fix the old issue where a Gumroad link accidentally became a local site path.
  url = url.replace(/^https?:\/\/(www\.)?cookiesdigitalcreations\.com\/(https?:\/\/)?/i, 'https://');
  url = url.replace(/^https?:\/\/(www\.)?cookiesdigitalcreations\.com\/(cookiepearson\.gumroad\.com\/)/i, 'https://$2');

  return url;
}

export default function CheckoutRedirectPage({ plan }) {
  const rawUrl = checkoutMap[plan];
  const url = cleanCheckoutUrl(rawUrl);

  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    redirect(url);
  }

  return (
    <main className="wrap dashboard">
      <span className="kicker">Checkout setup needed</span>
      <h1>{planLabels[plan] || 'Checkout'} link is missing.</h1>
      <p>The checkout button is working, but this project does not have a valid Gumroad URL saved for this plan yet.</p>
      <div className="notice error">
        Check this Vercel Environment Variable: <strong>{envNames[plan] || 'checkout URL'}</strong>. The value must start with <strong>https://</strong> and point to the correct Gumroad product.
      </div>
      <p>
        <Link className="btn" href="/pricing">Back to Pricing</Link>{' '}
        <Link className="btn dark" href="/builder">Back to Builder</Link>
      </p>
    </main>
  );
}
