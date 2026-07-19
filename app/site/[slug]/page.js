import { notFound } from 'next/navigation';
import SitePreview from '../../../lib/SitePreview';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic='force-dynamic';

function fallback(row){
  return row.site || {
    businessName: row.business_name || row.businessName || 'Published Website',
    customerEmail: row.customer_email || row.email || '',
    plan: row.plan || 'starter',
    headline: row.headline || 'A beautiful website created in minutes.',
    description: row.description || '',
    primaryColor: row.primaryColor || '#20172f',
    accentColor: row.accentColor || '#c46a2d',
    typeKey: row.template || 'local',
    pages: row.pages || ['Home','Services','Contact'],
    offerTitle: 'Services & Offers',
    offers: [
      {title:'Main Service',text:'Describe your service.'},
      {title:'Highlights',text:'Share what makes it special.'},
      {title:'Contact',text:'Tell people how to reach you.'}
    ],
    sections: {}
  };
}

function isBlocked(row){
  if(!row) return true;
  if(['paused','archived'].includes(row.status)) return true;
  if(['paused','archived'].includes(row.access_status)) return true;
  if(['canceled','ended','refunded','disputed','paused'].includes(row.subscription_status) && row.plan !== 'free') return true;
  return false;
}

export default async function Page({params}){
  const supabase=getSupabaseAdmin();
  const{data,error}=await supabase.from('websites').select('*').eq('slug',params.slug).maybeSingle();
  if(error||!data||isBlocked(data)) notFound();
  const site=fallback(data);
  return <SitePreview site={{...site,slug:params.slug}} live/>;
}
