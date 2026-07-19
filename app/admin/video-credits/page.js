'use client';
import { useState } from 'react';
import Nav from '../../../lib/Nav';

export default function AdminVideoCredits(){
 const[pin,setPin]=useState('');
 const[lookup,setLookup]=useState('');
 const[credits,setCredits]=useState(0);
 const[loading,setLoading]=useState(false);
 const[message,setMessage]=useState('');
 const[site,setSite]=useState(null);
 async function send(action){
  setLoading(true);setMessage('');
  try{
   const payload={pin,action,slug:lookup,email:lookup,credits};
   const res=await fetch('/api/admin/video-credits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok||!data.ok) throw new Error(data.error||'Request failed');
   if(data.website) setSite(data.website);
   setMessage(action==='lookup'?'Website found.':action==='reset_month'?'Monthly usage reset.':'Bonus video credits updated.');
  }catch(err){setMessage(err.message||'Something went wrong.');}
  setLoading(false);
 }
 return <><Nav/><main className="wrap"><section className="dashboard"><span className="kicker">Admin</span><h1>AI Video Credit Controls</h1><p>Use this page to check or adjust HeyGen real-video credits for one customer website. This page is owner/admin only.</p><div className="field"><label>Admin PIN</label><input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter admin PIN"/></div><div className="field"><label>Customer email, short website name, or full subdomain</label><input value={lookup} onChange={e=>setLookup(e.target.value)} placeholder="customer@email.com or my-business-name"/></div><p><button className="btn" disabled={loading} onClick={()=>send('lookup')}>Look Up Website</button></p>{site&&<div className="notice success"><strong>{site.business_name||site.businessName||site.slug}</strong><br/>Plan: {site.plan||site?.site?.plan||'not set'}<br/>Status: {site.status||'not set'}<br/>This month: {site.video_usage_month||0} used in {site.video_month_key||'current month'}<br/>Bonus credits: {site.video_bonus_credits||0}<br/>Lifetime generated: {site.video_lifetime_count||0}</div>}<div className="row"><div className="field"><label>Set bonus credits for this month</label><input type="number" min="0" max="100" value={credits} onChange={e=>setCredits(e.target.value)}/><small>Bonus credits are added on top of the plan limit.</small></div></div><p><button className="btn dark" disabled={loading||!site} onClick={()=>send('set_bonus')}>Save Bonus Credits</button> <button className="btn light" disabled={loading||!site} onClick={()=>send('reset_month')}>Reset Monthly Usage</button></p>{message&&<div className="notice">{message}</div>}</section></main></>
}
