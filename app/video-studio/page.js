'use client';
import { useMemo, useState } from 'react';
import Nav from '../../lib/Nav';

function safeJson(value){try{return JSON.parse(value)}catch{return null}}
function getInitialParams(){
 if(typeof window==='undefined') return { shouldReturn:false, draftSlug:'' };
 const params=new URLSearchParams(window.location.search);
 return { shouldReturn:params.get('return')==='builder', draftSlug:params.get('draft')||'' };
}

export default function VideoStudio(){
 const initial=getInitialParams();
 const savedDraft=typeof window!=='undefined'?localStorage.getItem('cookieDraftSite'):null;
 const draft=savedDraft?safeJson(savedDraft):null;
 const savedJob=typeof window!=='undefined'?safeJson(localStorage.getItem('cookieHeyGenJob')||'null'):null;
 const savedCustomer=typeof window!=='undefined'?safeJson(localStorage.getItem('cookieVideoCustomer')||'null'):null;
 const[biz,setBiz]=useState(draft?.businessName||savedCustomer?.businessName||'');
 const[promo,setPromo]=useState('');
 const[aud,setAud]=useState('local customers');
 const[type,setType]=useState('Business Promo');
 const[platform,setPlatform]=useState('TikTok / Reels');
 const[style,setStyle]=useState('Professional');
 const[length,setLength]=useState('15 seconds');
 const[voice,setVoice]=useState('Warm female voice');
 const[customerEmail,setCustomerEmail]=useState(draft?.email||savedCustomer?.email||'');
 const[websiteSlug,setWebsiteSlug]=useState(initial.draftSlug||draft?.slug||savedCustomer?.slug||'');
 const[accessCode,setAccessCode]=useState('');
 const[tab,setTab]=useState('Script');
 const[generateReal,setGenerateReal]=useState(false);
 const[loading,setLoading]=useState(false);
 const[statusLoading,setStatusLoading]=useState(false);
 const[error,setError]=useState('');
 const[job,setJob]=useState(savedJob||null);
 const tabNames=['Script','Captions','Shot List','Video Prompt','Voiceover','Next Steps'];
 const kit=useMemo(()=>makeKit({biz,promo,aud,type,platform,style,length,voice}),[biz,promo,aud,type,platform,style,length,voice]);
 function download(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()}
 function goBack(){window.location.href=websiteSlug?`/builder?draft=${encodeURIComponent(websiteSlug)}`:'/builder?restore=1'}
 function rememberJob(nextJob){setJob(nextJob);try{localStorage.setItem('cookieHeyGenJob',JSON.stringify(nextJob))}catch{}}
 function rememberCustomer(){try{localStorage.setItem('cookieVideoCustomer',JSON.stringify({email:customerEmail,slug:websiteSlug,businessName:biz}))}catch{}}
 async function createRealVideo(){
   setError(''); setLoading(true); rememberCustomer();
   try{
     const res=await fetch('/api/heygen/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessName:biz,promo,audience:aud,videoType:type,platform,style,length,voice,accessCode,customerEmail,websiteSlug})});
     const data=await res.json().catch(()=>({ok:false,error:'Could not read server response.'}));
     if(!res.ok||!data.ok){throw new Error(data.error||'HeyGen request failed.');}
     rememberJob({...data,createdAt:new Date().toISOString(),businessName:biz||'Your Business'});
   }catch(err){setError(err.message||'Something went wrong creating the video.');}
   setLoading(false);
 }
 async function checkStatus(){
   if(!job?.sessionId&&!job?.videoId){setError('No HeyGen job found yet. Generate a real video first.');return;}
   setError(''); setStatusLoading(true);
   try{
     const res=await fetch('/api/heygen/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:job.sessionId,videoId:job.videoId,jobId:job.jobId})});
     const data=await res.json().catch(()=>({ok:false,error:'Could not read status response.'}));
     if(!res.ok||!data.ok){throw new Error(data.error||'Could not check HeyGen status.');}
     rememberJob({...job,...data,checkedAt:new Date().toISOString()});
   }catch(err){setError(err.message||'Something went wrong checking the video.');}
   setStatusLoading(false);
 }
 const kitText=Object.entries(kit).map(([k,v])=>`${k}\n${v}`).join('\n\n---\n\n');
 return <><Nav/><main className="wrap aiKit"><section className="dashboard"><span className="kicker">AI Video Studio</span><h1>Create a Video Kit + HeyGen Video</h1><p>Create scripts and captions for any plan. Real HeyGen video is plan-limited so your API credits stay protected.</p>{initial.shouldReturn&&<div className="notice"><strong>Your website draft was saved before opening AI Video Studio.</strong><br/>Use the button below to return to the builder without losing your work.</div>}<div className="notice success"><strong>Plan limits:</strong><br/>Free: kit only. Starter: kit only. Business: 1 real HeyGen video/month. Premium: 3 real HeyGen videos/month. Owner/admin can test with the AI Video Access Code.</div><div className="navRow"><button className="btn dark" onClick={goBack}>Back to Website Builder</button><a className="btn light" href="/customer">Open My Website</a><a className="btn light" href="/video-studio/results">Video Results</a></div><div className="row"><div className="field"><label>Customer email for plan check</label><input value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} placeholder="customer@email.com"/></div><div className="field"><label>Website name / short subdomain</label><input value={websiteSlug} onChange={e=>setWebsiteSlug(e.target.value)} placeholder="my-business-name or my-business.cookiesdigitalcreations.com"/></div></div>{[['Business name',biz,setBiz],['What are they promoting?',promo,setPromo],['Target customer',aud,setAud]].map(([l,v,s])=><div className="field" key={l}><label>{l}</label><textarea value={v} onChange={e=>s(e.target.value)} placeholder={l==='What are they promoting?'?'Example: a new cleaning service, cookbook, beauty bundle, real estate guide, party package, or website service':''}/></div>)}<div className="row"><div className="field"><label>Video type</label><select value={type} onChange={e=>setType(e.target.value)}>{['Business Promo','Product Ad','Restaurant Promo','Real Estate Intro','Beauty Promo','Website Hero Video','Grand Opening Promo','Sale Announcement'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Platform</label><select value={platform} onChange={e=>setPlatform(e.target.value)}>{['TikTok / Reels','YouTube Short','Facebook Ad','Website Hero Video','Instagram Story'].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="row"><div className="field"><label>Style</label><select value={style} onChange={e=>setStyle(e.target.value)}>{['Professional','Funny','Luxury','3D Modern','Cartoon Fun','Cinematic','Warm & Friendly','Bold Sales Ad'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Length</label><select value={length} onChange={e=>setLength(e.target.value)}>{['15 seconds','30 seconds','45 seconds'].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="field"><label>Voice style</label><select value={voice} onChange={e=>setVoice(e.target.value)}>{['Warm female voice','Sassy female voice','Professional narrator','Friendly upbeat voice','Luxury commercial voice'].map(x=><option key={x}>{x}</option>)}</select></div><label className="checkLine"><input type="checkbox" checked={generateReal} onChange={e=>setGenerateReal(e.target.checked)}/> I understand real video generation uses HeyGen API credits.</label>{generateReal&&<div className="field"><label>Optional owner/admin AI Video Access Code</label><input value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="Only needed for owner override/testing" type="password"/><small>Customers can leave this blank. Their email or website name will be checked against their plan.</small></div>}<button className="btn" disabled={!generateReal||loading} onClick={createRealVideo}>{loading?'Checking plan and sending to HeyGen...':'Generate Real Video with HeyGen'}</button>{error&&<div className="notice danger"><strong>Error:</strong> {error}</div>}</section><section className="dashboard"><span className="kicker">Generated Video Kit</span><h1>{biz||'Your Business'} Promo Kit</h1><div className="pillTabs">{tabNames.map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</div><pre style={{whiteSpace:'pre-wrap',background:'#160c22',color:'white',padding:20,borderRadius:18}}>{kit[tab]}</pre><p><button className="btn" onClick={()=>navigator.clipboard.writeText(kit[tab])}>Copy {tab}</button> <button className="btn dark" onClick={()=>download(`${biz||'video'}-kit.txt`,kitText)}>Download Text Kit</button> <button className="btn dark" onClick={()=>download(`${biz||'video'}-kit.html`,`<html><body><h1>${biz||'Video'} Kit</h1><pre>${kitText.replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></body></html>`,'text/html')}>Download Full Kit</button></p><button className="btn" onClick={goBack}>Return to Builder</button><div className="notice"><strong>Creative kit mode is always available.</strong> If a customer is out of real-video credits, they can still download this kit.</div></section><section className="dashboard"><span className="kicker">HeyGen Video Job</span><h1>Real Video Status</h1><p><a className="btn light" href="/video-studio/results">Open Video Results Dashboard</a></p>{!job&&<p>No real HeyGen video has been started in this browser yet.</p>}{job&&<div><p><strong>Status:</strong> {job.status||'generating'}</p>{job.plan&&<p><strong>Plan checked:</strong> {job.ownerOverride?'Owner override':job.plan}</p>}{job.videoUsage&&!job.ownerOverride&&<p><strong>Monthly usage:</strong> {job.videoUsage.used} of {job.videoUsage.limit} used. {job.videoUsage.remaining} remaining.</p>}{job.usageWarning&&<div className="notice danger">{job.usageWarning}</div>}{job.sessionId&&<p><strong>Session:</strong> {job.sessionId}</p>}{job.videoId&&<p><strong>Video ID:</strong> {job.videoId}</p>}{job.heygenSessionUrl&&<p><a className="btn light" href={job.heygenSessionUrl} target="_blank" rel="noreferrer">Open in HeyGen</a></p>}<button className="btn" onClick={checkStatus} disabled={statusLoading}>{statusLoading?'Checking...':'Check Video Status'}</button>{job.videoUrl&&<div className="notice success"><strong>Video ready!</strong><br/><a href={job.videoUrl} target="_blank" rel="noreferrer">Open / Download HeyGen MP4</a><video src={job.videoUrl} controls style={{width:'100%',marginTop:14,borderRadius:18}}/></div>}{job.failureMessage&&<div className="notice danger"><strong>HeyGen failed:</strong> {job.failureMessage}</div>}</div>}</section></main></>
}
function makeKit({biz,promo,aud,type,platform,style,length,voice}){const b=biz||'your business';const p=promo||'your offer';return {Script:`HOOK: Looking for ${p}?\nSCENE 1: Show ${b} with bold text and ${style} visuals.\nSCENE 2: Explain the main benefit for ${aud}.\nSCENE 3: Show proof, services, products, or results.\nCTA: Visit our website today.`,Captions:`${b} is here to help with ${p}.\nClear. Simple. Professional.\nVisit our website today.`, 'Shot List':`1. Opening logo/title card\n2. Product/service close-up\n3. Three benefit text overlays\n4. Customer trust/review moment\n5. Call-to-action screen`, 'Video Prompt':`Create a ${length} vertical 9:16 ${type} for ${b}. Promote: ${p}. Style: ${style}. Platform: ${platform}. Use clean motion graphics, bold captions, smooth transitions, and a strong call to action. No copyrighted logos or celebrity likenesses.`, Voiceover:`Use a ${voice}. Say: Need ${p}? ${b} makes it simple. We help ${aud} get what they need with a clear, professional experience. Visit our website today.`, 'Next Steps':`Copy the script, captions, and prompt, or use the protected HeyGen button to create a real video. Business includes 1 real video per month. Premium includes 3 real videos per month. Owner testing can use the AI Video Access Code.`}}
