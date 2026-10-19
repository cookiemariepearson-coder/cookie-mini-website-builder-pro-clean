import Link from 'next/link';

export default function OwnerFooter() {
  return (
    <footer className="ownerProjectFooter cookieBuilderFooter" aria-label="Cookie Mini Website Builder support and policies">
      <div className="cookieBuilderFooterBrand">
        <img
          className="ownerProjectLogoImage"
          src="/cookie-mini-website-builder-logo.png"
          alt="Cookie Mini Website Builder Pro"
        />
        <div className="ownerProjectCopy">
          <strong>Cookie Mini Website Builder Pro</strong>
          <span>Simple, polished websites for creators and small businesses.</span>
          <a className="builderSupportEmail" href="mailto:hello@cookiesdigitalcreations.com">hello@cookiesdigitalcreations.com</a>
        </div>
      </div>
      <nav className="ownerProjectLinks" aria-label="Footer policies and support">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/refund-policy">Refund / Cancellation Policy</Link>
        <Link href="/legal">Legal Hub</Link>
        <Link href="/contact">Contact Us</Link>
      </nav>
    </footer>
  );
}
