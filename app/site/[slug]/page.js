import { notFound } from 'next/navigation';
import SitePreview from '../../../lib/SitePreview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeSiteRow(row = {}, slug = '') {
  let site = row.site || {};
  if (typeof site === 'string') {
    try { site = JSON.parse(site); } catch { site = {}; }
  }

  const merged = {
    ...site,
    slug: site.slug || row.slug || slug,
    businessName: site.businessName || row.business_name || row.businessName || 'Published Website',
    customerEmail: site.customerEmail || row.customer_email || row.email || '',
    phone: site.phone || row.phone || '',
    plan: site.plan || row.plan || 'free',
    status: site.status || row.status || 'published',
    headline: site.headline || row.headline || 'A beautiful website created in minutes.',
    description: site.description || row.description || '',
    primaryColor: site.primaryColor || row.primary_color || '#2a103b',
    accentColor: site.accentColor || row.accent_color || '#ffbd49',
    typeKey: site.typeKey || row.type_key || row.template || 'local',
    styleKey: site.styleKey || row.style_key || '',
    pages: Array.isArray(site.pages) && site.pages.length ? site.pages : (Array.isArray(row.pages) && row.pages.length ? row.pages : ['Home','Services','Contact']),
    sections: site.sections || {},
    offers: Array.isArray(site.offers) ? site.offers : [
      { title: 'Main Offer', text: 'Describe what this business offers.' },
      { title: 'Why Choose Us', text: 'Share what makes this business special.' },
      { title: 'Get Started', text: 'Tell customers how to contact, order, book, or buy.' }
    ],
    customerActions: Array.isArray(site.customerActions) ? site.customerActions : []
  };

  return merged;
}

function isBlocked(row = {}) {
  const status = String(row.status || '').toLowerCase();
  const access = String(row.access_status || '').toLowerCase();
  const subscription = String(row.subscription_status || '').toLowerCase();
  const plan = String(row.plan || row.site?.plan || '').toLowerCase();

  if (['paused','archived','deleted','inactive'].includes(status)) return true;
  if (['paused','archived','deleted','inactive'].includes(access)) return true;
  if (plan !== 'free' && ['canceled','ended','refunded','disputed','paused'].includes(subscription)) return true;
  return false;
}

async function fetchWebsite(slug = '') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !slug) return null;

  const url = `${supabaseUrl}/rest/v1/websites?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => []);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

export default async function PublishedSitePage({ params }) {
  const slug = params?.slug || '';
  const row = await fetchWebsite(slug);

  if (!row || isBlocked(row)) notFound();

  const site = normalizeSiteRow(row, slug);

  return (
    <main className="publishedSitePage">
      <SitePreview site={site} />
    </main>
  );
}
