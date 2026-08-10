import Link from 'next/link';
export default function CheckoutHome(){
  return <main className="wrap dashboard">
    <span className="kicker">Choose checkout</span>
    <h1>Cookie Mini Website Builder Checkout</h1>
    <p>Select the plan checkout you need.</p>
    <p>
      <Link className="btn" href="/builder?checkout=starter">Build with Starter Pro</Link>{' '}
      <Link className="btn" href="/builder?checkout=business">Build with Business</Link>{' '}
      <Link className="btn" href="/builder?checkout=premium">Build with Premium</Link>{' '}
      <Link className="btn dark" href="/customer">Open My Website for an Extra Page</Link>
    </p>
  </main>;
}
