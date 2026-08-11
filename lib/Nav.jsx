import Link from 'next/link';
import CustomerAccountLink from '../components/CustomerAccountLink';

export default function Nav(){return <nav className="nav" aria-label="Main navigation"><a className="logo homeLogoLink" href="https://www.cookiesdigitalcreations.com/" aria-label="Return to the Cookie Mini Website Builder homepage"><img className="navBrandLogo" src="/cookie-mini-website-builder-logo.png" alt="Cookie Mini Website Builder Pro" /> <span>Cookie Mini Website Builder Pro</span></a><div className="navLinks"><Link href="/builder">Start Building Free</Link><Link href="/pricing">Pricing</Link><Link href="/done-for-you">Done for You</Link><Link href="/video-studio">AI Video</Link><CustomerAccountLink /><Link href="/contact">Contact Us</Link></div></nav>}
