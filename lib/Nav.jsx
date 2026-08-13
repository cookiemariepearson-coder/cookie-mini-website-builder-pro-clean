import Link from 'next/link';
import CustomerAccountLink from '../components/CustomerAccountLink';
import { AccountAction } from '../components/AccountModalProvider';
import OwnerAccountControl from '../components/OwnerAccountControl';

export default function Nav({ context = 'customer' }) {
  const ownerContext = context === 'owner';
  const homeLink = <a className="logo homeLogoLink" href="https://www.cookiesdigitalcreations.com/" aria-label="Return to the Cookie Mini Website Builder homepage"><img className="navBrandLogo" src="/cookie-mini-website-builder-logo.png" alt="Cookie Mini Website Builder Pro" /> <span>Cookie Mini Website Builder Pro</span></a>;

  if (ownerContext) return <nav className="nav" aria-label="Owner navigation">
    {homeLink}
    <div className="navLinks ownerNavLinks">
      <Link href="/admin">Owner Dashboard</Link>
      <OwnerAccountControl />
      <Link className="ownerReturnLink" href="/">Return to Main Website</Link>
    </div>
  </nav>;

  return <nav className="nav" aria-label="Main navigation">
    {homeLink}
    <div className="navLinks">
      <AccountAction className="navBuilderAction" destination="/builder" guestAllowed mode="create">Start Building Free</AccountAction><Link href="/pricing">Pricing</Link><Link href="/done-for-you">Done for You</Link><Link href="/video-studio">AI Video</Link><CustomerAccountLink /><Link href="/contact">Contact Us</Link>
    </div>
  </nav>;
}
