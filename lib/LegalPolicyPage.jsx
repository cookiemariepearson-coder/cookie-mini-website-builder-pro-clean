const updated = 'July 19, 2026';

const page = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #fff7ef 0%, #f5ecff 45%, #1f0f31 100%)',
  padding: '32px 18px 70px',
  color: '#1f1734',
};

const shell = {
  maxWidth: '1040px',
  margin: '0 auto',
};

const card = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(55,28,85,0.12)',
  borderRadius: '28px',
  boxShadow: '0 26px 60px rgba(31,15,49,0.18)',
  padding: 'clamp(24px, 4vw, 48px)',
};

const eyebrow = {
  color: '#c76519',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 900,
  fontSize: '0.9rem',
};

const h1 = {
  fontSize: 'clamp(2.1rem, 5vw, 4.4rem)',
  lineHeight: 0.95,
  margin: '14px 0 18px',
};

const h2 = {
  fontSize: '1.55rem',
  margin: '32px 0 10px',
};

const p = {
  color: '#504966',
  fontSize: '1.05rem',
  lineHeight: 1.65,
};

const pill = {
  display: 'inline-block',
  background: '#fff4e8',
  border: '1px dashed #df852a',
  color: '#7d3a0d',
  borderRadius: '18px',
  padding: '12px 16px',
  margin: '16px 0',
  fontWeight: 800,
};

const nav = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  margin: '22px 0 0',
};

const navLink = {
  color: '#1f1734',
  background: '#fff',
  border: '1px solid rgba(31,23,52,0.14)',
  borderRadius: '999px',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
  marginTop: '28px',
};

const miniCard = {
  background: '#fff',
  border: '1px solid rgba(31,23,52,0.12)',
  borderRadius: '20px',
  padding: '18px',
  textDecoration: 'none',
  color: '#1f1734',
  boxShadow: '0 12px 30px rgba(31,15,49,0.08)',
};

export const legalLinks = [
  ['/legal/terms', 'Terms of Service'],
  ['/legal/privacy', 'Privacy Policy'],
  ['/legal/refund', 'Refund Policy'],
  ['/legal/subscription', 'Subscription & Cancellation Policy'],
  ['/legal/ai-video', 'AI Video Studio Policy'],
  ['/legal/customer-content-media', 'Customer Content & Media Policy'],
  ['/legal/website-hosting-pause-archive', 'Website Hosting / Pause / Archive Policy'],
  ['/legal/acceptable-use', 'Acceptable Use Policy'],
  ['/legal/support', 'Contact & Support Policy'],
];

export function LegalNav() {
  return (
    <div style={nav}>
      <a href="/" style={navLink}>Home</a>
      <a href="/builder" style={navLink}>Builder</a>
      <a href="/pricing" style={navLink}>Pricing</a>
      <a href="/customer-start" style={navLink}>Customer Guide</a>
      <a href="/legal" style={navLink}>Legal Hub</a>
    </div>
  );
}

export function LegalPolicyPage({ title, subtitle, children }) {
  return (
    <main style={page}>
      <section style={shell}>
        <article style={card}>
          <div style={eyebrow}>Cookie Mini Website Builder Pro</div>
          <h1 style={h1}>{title}</h1>
          <p style={p}>{subtitle}</p>
          <div style={pill}>Owned and operated by Southern Realty Investment Group, LLC. Last updated: {updated}.</div>
          <LegalNav />
          <div>{children}</div>
        </article>
      </section>
    </main>
  );
}

export function PolicySection({ title, children }) {
  return (
    <section>
      <h2 style={h2}>{title}</h2>
      <div style={p}>{children}</div>
    </section>
  );
}

export function PolicyList({ items }) {
  return (
    <ul style={{ ...p, paddingLeft: '22px' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: '9px' }}>{item}</li>)}
    </ul>
  );
}

export function LegalHub() {
  return (
    <main style={page}>
      <section style={shell}>
        <article style={card}>
          <div style={eyebrow}>Legal & Customer Policies</div>
          <h1 style={h1}>Clear rules for building, publishing, payments, uploads, and AI video.</h1>
          <p style={p}>These pages explain how Cookie Mini Website Builder Pro works, what customers are responsible for, how subscriptions and access are handled, and what happens when a website is paused, archived, canceled, refunded, or disputed.</p>
          <div style={pill}>Owned and operated by Southern Realty Investment Group, LLC.</div>
          <LegalNav />
          <div style={grid}>
            {legalLinks.map(([href, label]) => (
              <a href={href} key={href} style={miniCard}>
                <strong style={{ fontSize: '1.1rem' }}>{label}</strong>
                <p style={{ ...p, fontSize: '0.95rem', marginBottom: 0 }}>Review this policy.</p>
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export const finePrint = {
  color: '#6b627d',
  fontSize: '0.95rem',
  lineHeight: 1.55,
  background: '#fbf5ff',
  border: '1px solid rgba(31,23,52,0.10)',
  borderRadius: '18px',
  padding: '16px',
  marginTop: '26px',
};
