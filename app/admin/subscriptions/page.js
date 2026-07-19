'use client';
import { useState } from 'react';
import Nav from '../../../lib/Nav';

const subscriptionOptions = ['active','unverified','canceled','ended','refunded','disputed','paused'];
const accessOptions = ['active','paused','archived'];
const siteStatusOptions = ['published','paused','draft','archived'];
const planOptions = ['free','starter','business','premium'];

function pill(status){
  const s=String(status||'unverified');
  const color = ['active','published'].includes(s) ? '#147d43' : ['paused','canceled','ended','refunded','disputed','archived'].includes(s) ? '#a12d2d' : '#8a6500';
  return <span style={{background:color,color:'white',padding:'4px 9px',borderRadius:999,fontSize:12,fontWeight:800}}>{s}</span>;
}

export default function GumroadSubscriptionsAdmin(){
  const [pin,setPin]=useState('');
  const [ready,setReady]=useState(false);
  const [websites,setWebsites]=useState([]);
  const [events,setEvents]=useState([]);
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [registering,setRegistering]=useState(false);

  async function load(){
    setLoading(true); setMsg('');
    const res=await fetch('/api/admin/subscriptions/list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
    const data=await res.json();
    setLoading(false);
    if(!data.ok){setMsg(data.error||'Could not load subscription dashboard.');return;}
    setReady(true); setWebsites(data.websites||[]); setEvents(data.events||[]);
  }
  async function update(slug,updates){
    const res=await fetch('/api/admin/subscriptions/manual-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,slug,updates})});
    const data=await res.json();
    if(!data.ok){setMsg(data.error||'Update failed.');return;}
    await load();
  }
  async function registerHooks(){
    setRegistering(true); setMsg('');
    const res=await fetch('/api/gumroad/register-webhooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
    const data=await res.json();
    setRegistering(false);
    if(!data.ok){setMsg(data.error||'Webhook registration failed.');return;}
    setMsg('Gumroad webhook registration request completed. Check results below or Gumroad resource subscriptions.');
    setEvents([{resource_name:'setup',action_taken:JSON.stringify(data.results,null,2),processed_at:new Date().toISOString()},...events]);
  }
  const activeCount = websites.filter(w=>w.access_status==='active' && w.status==='published').length;
  const pausedCount = websites.filter(w=>w.access_status==='paused'||w.status==='paused').length;
  const unmatchedEvents = events.filter(e=>!e.matched_slug).length;

  return <><Nav/><main className="wrap dashboard"><span className="kicker">Owner only</span><h1>Gumroad Subscription Status + Access Control</h1><p>This page helps you see which paid websites are active, paused, canceled, refunded, or waiting for manual review.</p>{!ready&&<section className="card"><h2>Enter Admin PIN</h2><div className="field"><label>Admin PIN</label><input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter your PIN"/></div><button className="btn" onClick={load} disabled={loading}>{loading?'Opening...':'Open Subscription Dashboard'}</button>{msg&&<div className="notice danger">{msg}</div>}</section>}{ready&&<><div className="navRow"><button className="btn dark" onClick={()=>{setReady(false);setPin('');setWebsites([]);setEvents([])}}>Lock Dashboard</button><button className="btn" onClick={load}>Refresh</button><button className="btn light" onClick={registerHooks} disabled={registering}>{registering?'Registering...':'Register Gumroad Webhooks'}</button><a className="btn light" href="/admin">Back to Admin</a></div>{msg&&<div className="notice">{msg}</div>}<div className="stats"><div><strong>{websites.length}</strong><span>Total Sites</span></div><div><strong>{activeCount}</strong><span>Active</span></div><div><strong>{pausedCount}</strong><span>Paused</span></div><div><strong>{unmatchedEvents}</strong><span>Unmatched Gumroad Events</span></div></div><section className="card"><h2>Websites & Subscription Access</h2><div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Website</th><th>Customer</th><th>Plan</th><th>Subscription</th><th>Access</th><th>Site Status</th><th>Gumroad</th><th>Notes</th></tr></thead><tbody>{websites.map(w=><tr key={w.slug}><td><strong>{w.businessName||w.business_name||w.slug}</strong><br/><a href={`https://${w.slug}.cookiesdigitalcreations.com`} target="_blank">{w.slug}</a></td><td>{w.customer_email||w.email||w.gumroad_email||'—'}</td><td><select value={w.plan||'free'} onChange={e=>update(w.slug,{plan:e.target.value})}>{planOptions.map(x=><option key={x}>{x}</option>)}</select></td><td>{pill(w.subscription_status)}<br/><select value={w.subscription_status||'unverified'} onChange={e=>update(w.slug,{subscription_status:e.target.value})}>{subscriptionOptions.map(x=><option key={x}>{x}</option>)}</select></td><td>{pill(w.access_status)}<br/><select value={w.access_status||'active'} onChange={e=>update(w.slug,{access_status:e.target.value,status:e.target.value==='active'?'published':'paused',paused_reason:e.target.value==='paused'?'Paused manually by admin.':''})}>{accessOptions.map(x=><option key={x}>{x}</option>)}</select></td><td><select value={w.status||'published'} onChange={e=>update(w.slug,{status:e.target.value})}>{siteStatusOptions.map(x=><option key={x}>{x}</option>)}</select></td><td><small>{w.gumroad_product_name||'No product yet'}<br/>{w.gumroad_last_event||'No event'} {w.gumroad_last_event_at?new Date(w.gumroad_last_event_at).toLocaleString():''}</small></td><td><textarea rows={3} defaultValue={w.admin_notes||''} onBlur={e=>update(w.slug,{admin_notes:e.target.value})} placeholder="Private admin notes"/></td></tr>)}</tbody></table></div></section><section className="card"><h2>Recent Gumroad Events</h2><p>Events with no matched website need manual review. Add a custom Gumroad checkout field named Website name/subdomain to make matching easier.</p><div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Time</th><th>Event</th><th>Email</th><th>Product</th><th>Matched Site</th><th>Action</th></tr></thead><tbody>{events.map((e,i)=><tr key={e.id||i}><td>{e.processed_at?new Date(e.processed_at).toLocaleString():'—'}</td><td>{e.resource_name}</td><td>{e.email||'—'}</td><td>{e.product_name||'—'}</td><td>{e.matched_slug||'Needs review'}</td><td><small>{e.action_taken}</small></td></tr>)}</tbody></table></div></section><section className="card"><h2>Webhook URL</h2><p>Use this endpoint for Gumroad resource subscriptions if you set them manually:</p><pre style={{whiteSpace:'pre-wrap'}}>https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=sale</pre><p>Create one subscription for each resource: sale, refund, cancellation, subscription_ended, subscription_restarted, subscription_updated, dispute, and dispute_won.</p></section></>}</main></>;
}
