import CheckoutRedirectPage from '../../../lib/checkoutRedirect';
export const dynamic = 'force-dynamic';
export default async function PremiumCheckout({ searchParams }){ const params = await searchParams; return <CheckoutRedirectPage plan="premium" intentId={params?.intent || ''} />; }
