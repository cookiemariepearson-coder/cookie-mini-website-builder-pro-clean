import Link from 'next/link';

export default function OwnerFooter() {
  return (
    <footer className="ownerProjectFooter southernOnlyFooter" aria-label="Southern Realty ownership footer">
      <img
        className="ownerProjectLogoImage"
        src="/southern-realty-logo.png"
        alt="Southern Realty Investment Group, LLC logo"
      />
      <div className="ownerProjectCopy">
        <strong>Owned and operated by Southern Realty Investment Group, LLC</strong>
        <span>All proceeds from Cookie Mini Website Builder support the company&apos;s business operations.</span>
        <nav className="ownerProjectLinks" aria-label="Footer policies and support">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund / Cancellation Policy</Link>
          <Link href="/legal">Legal Hub</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>
      </div>
    </footer>
  );
}
