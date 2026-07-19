import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeSlug(value) {
  let input = String(value || '').trim().toLowerCase();
  if (!input) return '';
  input = input.replace(/^https?:\/\//, '').replace(/^www\./, '');
  input = input.split('?')[0].split('#')[0];
  if (input.includes('/site/')) input = input.split('/site/')[1] || input;
  input = input.split('/')[0] || input;
  const root = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').toLowerCase();
  if (input.endsWith(`.${root}`)) input = input.slice(0, -1 * (`.${root}`).length);
  if (input === root) return '';
  return input.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
function cleanEmail(value){const email=String(value||'').trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:'';}
function headers(){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;return {apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'};}
async function get(path){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY)return {ok:false,error:'Supabase env missing'};const res=await fetch(`${url}/rest/v1/${path}`,{headers:headers(),cache:'no-store'});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text}return {ok:res.ok,status:res.status,data};}
async function patch(path, body){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY)return {ok:false,error:'Supabase env missing'};const res=await fetch(`${url}/rest/v1/${path}`,{method:'PATCH',headers:headers(),body:JSON.stringify(body)});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text}return {ok:res.ok,status:res.status,data};}
async function findWebsite({slug,email}){if(slug){const r=await get(`websites?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);if(r.ok&&Array.isArray(r.data)&&r.data[0])return r.data[0];}
if(email){const r=await get(`websites?email=eq.${encodeURIComponent(email)}&select=*&order=updated_at.desc&limit=1`);if(r.ok&&Array.isArray(r.data)&&r.data[0])return r.data[0];}
return null;}
function adminOk(pin){return String(pin||'').trim() && String(pin||'').trim()===String(process.env.ADMIN_PIN||'').trim();}
export async function POST(request){
 try{
  const body=await request.json().catch(()=>({}));
  if(!adminOk(body.pin)) return NextResponse.json({ok:false,error:'Invalid admin PIN.'},{status:403});
  const action=String(body.action||'lookup');
  const slug=normalizeSlug(body.slug||body.websiteSlug||'');
  const email=cleanEmail(body.email||body.customerEmail||'');
  const website=await findWebsite({slug,email});
  if(!website) return NextResponse.json({ok:false,error:'No website found.'},{status:404});
  if(action==='lookup') return NextResponse.json({ok:true,website});
  if(action==='reset_month'){
    const r=await patch(`websites?id=eq.${encodeURIComponent(website.id)}`,{video_usage_month:0,video_month_key:new Date().toISOString().slice(0,7),last_video_status:'reset_by_admin'});
    return NextResponse.json({ok:r.ok,website:r.data?.[0]||null,error:r.ok?null:'Could not reset usage.',detail:r.data});
  }
  if(action==='set_bonus'){
    const credits=Math.max(0,Math.min(100,Number(body.credits||0)));
    const r=await patch(`websites?id=eq.${encodeURIComponent(website.id)}`,{video_bonus_credits:credits});
    return NextResponse.json({ok:r.ok,website:r.data?.[0]||null,error:r.ok?null:'Could not update bonus credits.',detail:r.data});
  }
  return NextResponse.json({ok:false,error:'Unknown action.'},{status:400});
 }catch(error){return NextResponse.json({ok:false,error:error?.message||'Admin video credits error.'},{status:500});}
}
