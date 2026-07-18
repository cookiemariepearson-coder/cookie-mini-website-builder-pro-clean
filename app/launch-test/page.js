import Link from 'next/link';
import Nav from '../../lib/Nav';

const checks = [
  ['Free Launch Page', 'Build one free site, save draft, publish, and open the customer subdomain.'],
  ['Starter Checkout', 'Select Starter Pro, click checkout, confirm it opens the $19/mo Gumroad subscription.'],
  ['Business Checkout', 'Select Business, click checkout, confirm it opens the $30/mo Gumroad subscription.'],
  ['Premium Checkout', 'Select Premium, click checkout, confirm it opens the $50/mo Gumroad subscription.'],
  ['Extra Page Checkout', 'Try to add a page beyond the plan limit and confirm the $10/mo extra page checkout opens.'],
  ['Customer Dashboard', 'Search by email only, short website name, and full subdomain. Confirm drafts and published sites show.'],
  ['Admin Dashboard', 'Open /admin, enter PIN manually, review plans/status/notes, and lock admin again.'],
  ['Template Switching', 'Change website type and template look. Confirm preview changes layout, colors, artwork, and section style.'],
  ['Media Upload', 'Upload hero image, add gallery image, and add a media/video link. Confirm preview and save still work.'],
  ['AI Video Studio', 'Generate a video kit, download the kit, and return back to the builder/customer dashboard.']
];

export default function LaunchTest() {
  return <>
    <Nav />
    <main className="wrap" style={{paddingTop:28}}>
      <section className="heroPage" style={{padding:'42px 26px'}}>
        <span className="kicker">Final Launch Testing</span>
        <h1>Cookie Mini Website Builder test checklist</h1>
        <p>Run through this list before promoting the website publicly. If each item passes, the platform is ready for soft launch.</p>
        <p><Link className="btn" href="/builder">Test Builder</Link> <Link className="btn dark" href="/admin">Test Admin</Link></p>
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Launch checklist</h2>
        <div style={{display:'grid',gap:12}}>
          {checks.map(([title, text], idx) => <div key={title} style={{display:'grid',gridTemplateColumns:'42px 1fr',gap:12,alignItems:'start',padding:'14px',border:'1px solid rgba(255,255,255,.12)',borderRadius:16,background:'rgba(255,255,255,.04)'}}>
            <div style={{width:34,height:34,borderRadius:12,background:'#f0a21f',color:'#1b102b',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>{idx+1}</div>
            <div><strong>{title}</strong><p style={{margin:'4px 0 0'}}>{text}</p></div>
          </div>)}
        </div>
      </section>

      <section className="cardGrid" style={{marginTop:22}}>
        <div className="card"><h2>Public pages</h2><p><Link href="/pricing">Pricing</Link><br/><Link href="/how-it-works">How It Works</Link><br/><Link href="/faq">FAQ</Link><br/><Link href="/contact">Contact</Link></p></div>
        <div className="card"><h2>Customer pages</h2><p><Link href="/builder">Builder</Link><br/><Link href="/customer">My Website</Link><br/><Link href="/customer-start">Customer Start Guide</Link><br/><Link href="/video-studio">AI Video Studio</Link></p></div>
        <div className="card"><h2>Owner pages</h2><p><Link href="/admin">Admin</Link><br/><Link href="/owner-launch">Owner Launch Checklist</Link></p></div>
      </section>
    </main>
  </>;
}
