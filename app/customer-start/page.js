import Link from 'next/link';
import Nav from '../../lib/Nav';

const steps = [
  ['1', 'Choose your plan', 'Start with the Free Launch Page or pick Starter, Business, or Premium when you are ready to publish more features.'],
  ['2', 'Choose Type & Look', 'Pick the kind of website you need, then choose the visual style that fits your brand.'],
  ['3', 'Enter website information', 'Add your business name, email, headline, description, offers, pages, and contact details.'],
  ['4', 'Save your draft', 'Click Save Draft before leaving the builder, opening AI Video Studio, or coming back later.'],
  ['5', 'Preview and publish', 'Review your website. Free pages publish directly. Paid subscriptions go through checkout first.'],
  ['6', 'Come back to edit', 'Use My Website to find your drafts and published websites by email or website name.']
];

export default function CustomerStart() {
  return <>
    <Nav />
    <main className="wrap" style={{paddingTop: 28}}>
      <section className="heroPage" style={{padding: '42px 26px'}}>
        <span className="kicker">Customer Guide</span>
        <h1>How to build your website</h1>
        <p>Use this page if you are starting a new website, returning to a draft, or trying to publish your site after checkout.</p>
        <p>
          <Link className="btn" href="/builder">Start Building</Link>{' '}
          <Link className="btn dark" href="/customer">Open My Website</Link>
        </p>
      </section>

      <section className="cardGrid" style={{marginTop: 22}}>
        {steps.map(([num, title, text]) => <div className="card" key={num}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:38,height:38,borderRadius:14,background:'#f0a21f',color:'#1b102b',fontWeight:900,marginBottom:10}}>{num}</div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>)}
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Returning to a draft</h2>
        <p>Go to <strong>My Website</strong>, enter your email or website name, then choose <strong>Continue Draft</strong>. Drafts and published sites are shown together so you do not have to remember the whole subdomain.</p>
        <p><Link className="btn" href="/customer">Find My Website</Link></p>
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Using AI Video Studio</h2>
        <p>AI Video Studio creates a promo kit with a script, captions, shot list, voiceover, and video prompt. Save your website draft before opening AI Video Studio so your builder work is still there when you return.</p>
        <p><Link className="btn dark" href="/video-studio">Open AI Video Studio</Link></p>
      </section>
    </main>
  </>;
}
