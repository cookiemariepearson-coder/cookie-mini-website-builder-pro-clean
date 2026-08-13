'use client';
import { useEffect, useState } from 'react';
import OwnerSignInPanel from '../../../components/OwnerSignInPanel';

export default function AdminVideoCredits(){
 const[authorized,setAuthorized]=useState(false);
 const[lookup,setLookup]=useState('');
 const[credits,setCredits]=useState(0);
 const[loading,setLoading]=useState(false);
 const[message,setMessage]=useState('');
 const[site,setSite]=useState(null);
 useEffect(()=>{fetch('/api/admin/video-credits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session_check'})}).then(r=>{if(r.status!==401&&r.status!==403)setAuthorized(true);});},[]);
 async function send(action){
  setLoading(true);setMessage('');
  try{
   const payload={action,slug:lookup,email:lookup,credits};
   const res=await fetch('/api/admin/video-credits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok||!data.ok) throw new Error(data.error||'Request failed');
   if(data.website) setSite(data.website);
   setMessage(action==='lookup'?'Website found.':action==='reset_month'?'Monthly usage reset.':'Bonus video credits updated.');
  }catch(err){setMessage(err.message||'Something went wrong.');}
  setLoading(false);
 }
 return <main className="wrap dashboard adminWarmPage adminVideoCreditsWarm"><section className="adminWarmHero"><div><span className="kicker">Owner only</span><h1>AI Video Credit Controls</h1><p>Check or adjust HeyGen real-video credits for one customer website.</p></div><div className="adminHeroBadge" aria-hidden="true"><span>✦</span><strong>AI Video</strong><small>Credit Manager</small></div></section><nav className="adminQuickLinks" aria-label="Admin tools"><a href="/admin">Website Management</a><a href="/admin/subscriptions">Subscriptions &amp; Access</a><a className="active" href="/admin/video-credits">AI Video Credits</a><a href="/admin/requests">Customer Requests</a></nav><section className="adminPanel adminCreditPanel">{!authorized?<OwnerSignInPanel returnPath="/admin/video-credits" description="Enter the owner email and password to manage protected AI Video credits." />:<><div className="adminTwoColumn"><div><div className="field"><label>Customer email, short website name, or full subdomain</label><input value={lookup} onChange={e=>setLookup(e.target.value)} placeholder="customer@email.com or my-business-name"/></div><button className="btn" disabled={loading} onClick={()=>send('lookup')}>{loading?'Looking up...':'Look Up Website'}</button></div><div className="adminCreditTip"><strong>How this works</strong><p>Look up the customer first. Then add bonus credits or reset only the current month&apos;s usage.</p></div></div>{site&&<div className="notice success adminCreditResult"><strong>{site.business_name||site.businessName||site.slug}</strong><br/>Plan: {site.plan||site?.site?.plan||'not set'}<br/>Status: {site.status||'not set'}<br/>This month: {site.video_usage_month||0} used in {site.video_month_key||'current month'}<br/>Bonus credits: {site.video_bonus_credits||0}<br/>Lifetime generated: {site.video_lifetime_count||0}</div>}<div className="field"><label>Set bonus credits for this month</label><input type="number" min="0" max="100" value={credits} onChange={e=>setCredits(e.target.value)}/><small>Bonus credits are added on top of the plan limit.</small></div><div className="adminCreditActions"><button className="btn dark" disabled={loading||!site} onClick={()=>send('set_bonus')}>Save Bonus Credits</button><button className="btn light" disabled={loading||!site} onClick={()=>send('reset_month')}>Reset Monthly Usage</button></div></>}{message&&<div className="notice">{message}</div>}</section></main>
}
