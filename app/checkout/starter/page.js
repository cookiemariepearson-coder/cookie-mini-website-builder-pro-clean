import CheckoutRedirectPage from '../../../lib/checkoutRedirect';
export const dynamic = 'force-dynamic';
export default async function StarterCheckout({ searchParams }){ const params = await searchParams; return <CheckoutRedirectPage plan="starter" intentId={params?.intent || ''} />; }
