import Link from 'next/link';
export default function CheckoutHome(){
  return <main className="wrap dashboard">
    <span className="kicker">Choose checkout</span>
    <h1>Cookie Mini Website Builder Checkout</h1>
    <p>Select the plan checkout you need.</p>
    <p>
      <Link className="btn" href="/checkout/starter">Starter Pro</Link>{' '}
      <Link className="btn" href="/checkout/business">Business</Link>{' '}
      <Link className="btn" href="/checkout/premium">Premium</Link>{' '}
      <Link className="btn dark" href="/checkout/extra">Extra Page</Link>
    </p>
  </main>;
}
