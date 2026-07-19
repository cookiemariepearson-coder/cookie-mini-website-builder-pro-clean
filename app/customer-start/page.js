import Link from 'next/link';
import Nav from '../../lib/Nav';

const steps = [
  ['1', 'Start or continue', 'Use Start Building for a new website, or My Website to reopen drafts and published sites.'],
  ['2', 'Choose type and look', 'Pick the website purpose first, then choose the visual style that matches the brand.'],
  ['3', 'Enter website details', 'Add the business name, email, headline, description, offers, contact details, and page wording.'],
  ['4', 'Add media', 'Upload a hero image, add gallery images, or paste video/media links where the selected page supports them.'],
  ['5', 'Save the draft', 'Use Save Draft / Continue Later before leaving the builder, opening AI Video Studio, or checking out.'],
  ['6', 'Publish or checkout', 'Free pages publish directly. Paid plans go through checkout first, then return to publish.']
];

const customerTips = [
  'You can search My Website with just your email address.',
  'You can also enter only the short website name, like cookies-kitchen-menu.',
  'Drafts and published websites appear together in one list.',
  'Free Launch Page publishes one Home page. More pages require a paid plan.',
  'AI Video Studio currently creates scripts, captions, prompts, and a downloadable kit.'
];

export default function CustomerStart() {
  return <>
    <Nav />
    <main className="wrap customerStartPage" style={{paddingTop: 28}}>
      <section className="heroPage customerHero" style={{padding: '42px 26px'}}>
        <span className="kicker">Customer Guide</span>
        <h1>Start, save, and publish your website.</h1>
        <p>This guide helps customers know exactly where to build, where to save drafts, and where to return later to edit their website.</p>
        <div className="customerActionRow">
          <Link className="btn" href="/builder">Start Building</Link>
          <Link className="btn dark" href="/customer">Find My Drafts / Website</Link>
          <Link className="btn light" href="/pricing">View Plans</Link>
        </div>
      </section>

      <section className="customerQuickPanel">
        <div>
          <span className="kicker">Quick reminder</span>
          <h2>How customers return later</h2>
          <p>Go to <strong>My Website</strong> and search with an email address, website name, or full subdomain. They do not need to remember the full website link.</p>
        </div>
        <Link className="btn dark" href="/customer">Open My Website</Link>
      </section>

      <section className="cardGrid" style={{marginTop: 22}}>
        {steps.map(([num, title, text]) => <div className="card guideStep" key={num}>
          <div className="stepBadge">{num}</div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>)}
      </section>

      <section className="card customerChecklist" style={{marginTop:22}}>
        <h2>Before starting, have this ready</h2>
        <div className="miniChecklist">
          <span>Business or brand name</span>
          <span>Contact email</span>
          <span>Short website name</span>
          <span>Headline and short description</span>
          <span>Services, offers, products, or menu items</span>
          <span>Images or links, if available</span>
        </div>
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Helpful notes</h2>
        <ul className="friendlyList">
          {customerTips.map(t => <li key={t}>{t}</li>)}
        </ul>
        <p className="mutedText">Any issues, click the Contact Us button for help.</p>
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Using AI Video Studio</h2>
        <p>AI Video Studio saves the current builder draft before opening when launched from the builder. Use the return button inside AI Video Studio to go back to the same draft.</p>
        <p><Link className="btn dark" href="/video-studio">Open AI Video Studio</Link></p>
      </section>
    </main>
  </>;
}
