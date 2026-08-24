import CheckoutRedirectPage from '../../../lib/checkoutRedirect';
export const dynamic = 'force-dynamic';
export default async function BusinessCheckout({ searchParams }){ const params = await searchParams; return <CheckoutRedirectPage plan="business" intentId={params?.intent || ''} />; }
