import CheckoutRedirectPage from '../../../lib/checkoutRedirect';
export const dynamic = 'force-dynamic';
export default async function ExtraCheckout({ searchParams }){ const params = await searchParams; return <CheckoutRedirectPage plan="extra" intentId={params?.intent || ''} />; }
