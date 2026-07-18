'use client';
import { useEffect, useMemo, useState } from 'react';
import SitePreview from '../../lib/SitePreview';
import { createDefaultSite, templateLibrary, getTemplate, pageOptions, plans, slugify, sectionPrompts } from '../../lib/siteDefaults';

const checkout = {
  starter: '/checkout/starter',
  business: '/checkout/business',
  premium: '/checkout/premium',
  extra: '/checkout/extra'
};

const DRAFT_KEY = 'cookieDraftSite';
const LAST_STEP_KEY = 'cookieBuilderStep';

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function nowStamp() {
  return new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function Builder(){
 const [step,setStep]=useState(0);
 const [site,setSite]=useState(()=>createDefaultSite());
 const [message,setMessage]=useState('');
 const [saveMessage,setSaveMessage]=useState('');
 const tmpl=useMemo(()=>getTemplate(site.typeKey,site.styleKey),[site.typeKey,site.styleKey]);

 useEffect(()=>{
   const saved = safeParse(localStorage.getItem(DRAFT_KEY));
   const savedStep = Number(localStorage.getItem(LAST_STEP_KEY) || 0);
   if(saved){
     setSite(s => ({...createDefaultSite({typeKey:saved.typeKey,styleKey:saved.styleKey}), ...saved}));
     if(!Number.isNaN(savedStep)) setStep(savedStep);
     setSaveMessage('Draft restored from this browser.');
   }
 },[]);

 useEffect(()=>{
   const handle = setTimeout(()=>{
     localStorage.setItem(DRAFT_KEY, JSON.stringify(site));
     localStorage.setItem(LAST_STEP_KEY, String(step));
   }, 250);
   return ()=>clearTimeout(handle);
 },[site,step]);

 function update(p){setSite(s=>({...s,...p}))}
 function chooseType(key){
   const type=templateLibrary.find(t=>t.key===key);
   const ns=createDefaultSite({typeKey:key,styleKey:type.styles[0].key});
   update({
     ...ns,
     businessName:site.businessName,
     customerEmail:site.customerEmail,
     phone:site.phone,
     plan:site.plan,
     primaryColor:site.primaryColor,
     accentColor:site.accentColor,
     heroImage:site.heroImage,
     heroMediaLink:site.heroMediaLink,
     pages:['Home'],
     desiredPages:type.pages
   });
 }
 function selectStyle(key){update({styleKey:key})}
 function planLimit(){return plans[site.plan]?.maxPages || 1}
 function addPage(p){
   if(site.pages.includes(p)) return;
   const limit=planLimit();
   if(site.pages.length>=limit && site.plan!=='premium'){
     setMessage(`${plans[site.plan]?.label} includes ${limit} page(s). Extra pages are $10/month each.`);
     window.location.href = checkout.extra;
     return;
   }
   update({pages:[...site.pages,p]});
 }
 function removePage(p){ if(p==='Home') return; update({pages:site.pages.filter(x=>x!==p)});}
 function persistLocal(note='Draft saved in this browser.'){localStorage.setItem(DRAFT_KEY,JSON.stringify(site));localStorage.setItem(LAST_STEP_KEY,String(step));setSaveMessage(`${note} ${nowStamp()}`)}
 async function saveDraft(){
   const s={...site,slug:slugify(site.businessName)};
   localStorage.setItem(DRAFT_KEY,JSON.stringify(s));
   setSaveMessage('Saving draft...');
   try{
     const res=await fetch('/api/site/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site:s})});
     const data=await res.json();
     setSaveMessage(data.ok?`Draft saved. You can return with this browser or customer dashboard. ${nowStamp()}`:data.error);
   } catch(e){
     setSaveMessage(`Draft saved in this browser. Online draft could not save: ${e.message}`);
   }
 }
 function goVideo(){persistLocal('Draft saved before opening AI Video Studio.'); window.location.href='/video-studio?return=builder'}
 async function publishFree(){
   const s={...site,slug:slugify(site.businessName),pages:['Home'],plan:'free'};
   localStorage.setItem(DRAFT_KEY,JSON.stringify(s));
   setMessage('Publishing free launch page...');
   const res=await fetch('/api/site/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site:s})});
   const data=await res.json();
   if(data.ok) location.href=`/checkout/success?paid=free`; else setMessage(data.error || 'Publish failed.');
 }
 function checkoutPlan(){
   const s={...site,slug:slugify(site.businessName)};
   localStorage.setItem(DRAFT_KEY,JSON.stringify(s));
   const url=checkout[site.plan];
   if(!url){setMessage('Checkout route missing.');return;}
   location.href=url;
 }
 function uploadHero(file){const r=new FileReader();r.onload=()=>update({heroImage:r.result});r.readAsDataURL(file)}
 function next(){setStep(s=>Math.min(4,s+1));persistLocal('Draft saved.');}
 function back(){setStep(s=>Math.max(0,s-1));persistLocal('Draft saved.');}
 return <main className="builderShell"><aside className="builderSide"><h1>Cookie Mini Website Builder Pro</h1>{['Choose Type & Look','Website Info','Design','Pages & Wording','Preview & Publish'].map((x,i)=><button className={`stepBtn ${step===i?'active':''}`} onClick={()=>setStep(i)} key={x}>{i+1}. {x}</button>)}<div className="notice">Any issues, click the Contact Us button for help.</div><button className="btn light" onClick={saveDraft}>Save Draft</button><button className="btn light" onClick={goVideo}>AI Video Studio</button>{saveMessage&&<div className="notice smallNotice">{saveMessage}</div>}</aside><section className="builderMain"><div className="row builderTwoCol"><div className="dashboard">{step===0&&<><h2>Choose website type and design look</h2><p className="mutedText">Pick what the site is for first. Then pick the visual look. This changes the starter wording, pages, artwork, and design feel.</p><div className="templateList">{templateLibrary.map(t=><button className={`pick ${site.typeKey===t.key?'active':''}`} onClick={()=>chooseType(t.key)} key={t.key}><strong>{t.type}</strong><br/><small>{t.styles.map(s=>s.name).join(' / ')}</small></button>)}</div><h3>Choose visual style</h3><div className="templateList">{tmpl.type.styles.map(s=><button className={`pick ${site.styleKey===s.key?'active':''}`} onClick={()=>selectStyle(s.key)} key={s.key}><span style={{fontSize:34}}>{s.art}</span><br/><strong>{s.name}</strong><br/><small>{s.visual || s.mood}</small></button>)}</div></>}
{step===1&&<><h2>Website Info</h2><p className="mutedText">This is where customers enter the words that build the website. The preview updates on the right.</p>{['businessName','customerEmail','phone','headline'].map(k=><div className="field" key={k}><label>{k==='businessName'?'Business / website name':k==='customerEmail'?'Customer email for Contact button and dashboard':'phone'===k?'Phone (optional; not shown in top header)':'Homepage headline'}</label><input value={site[k]||''} onChange={e=>update({[k]:e.target.value})}/></div>)}<div className="field"><label>Homepage description</label><textarea value={site.description} onChange={e=>update({description:e.target.value})}/></div><div className="field"><label>Home extra wording / short intro</label><textarea value={site.sections?.Home || ''} onChange={e=>update({sections:{...site.sections,Home:e.target.value}})}/></div><div className="field"><label>Offer section title</label><input value={site.offerTitle} onChange={e=>update({offerTitle:e.target.value})}/></div>{site.offers.map((o,i)=><div className="card miniCard" key={i}><h3>Offer Box {i+1}</h3><label>Box title</label><input value={o.title} onChange={e=>{const offers=[...site.offers];offers[i]={...offers[i],title:e.target.value};update({offers})}}/><label>Box wording</label><textarea value={o.text} onChange={e=>{const offers=[...site.offers];offers[i]={...offers[i],text:e.target.value};update({offers})}}/></div>)}<div className="navRow"><button className="btn dark" onClick={back}>Back</button><button className="btn" onClick={next}>Save & Continue</button></div></>}
{step===2&&<><h2>Design</h2><p className="mutedText">Choose plan, colors, artwork, and media. Customers can upload a small image or add a video/media link to help design the site.</p><div className="field"><label>Plan</label><select value={site.plan} onChange={e=>update({plan:e.target.value,pages:e.target.value==='free'?['Home']:site.pages})}>{Object.entries(plans).map(([k,v])=><option value={k} key={k}>{v.label} - {v.price}</option>)}</select></div><div className="templateList">{tmpl.type.styles.map(s=><button className={`pick ${site.styleKey===s.key?'active':''}`} onClick={()=>selectStyle(s.key)} key={s.key}><span style={{fontSize:34}}>{s.art}</span><br/><strong>{s.name}</strong><br/><small>{s.visual || s.mood}</small></button>)}</div><div className="row"><div className="field"><label>Main color</label><input type="color" value={site.primaryColor} onChange={e=>update({primaryColor:e.target.value})}/></div><div className="field"><label>Accent color</label><input type="color" value={site.accentColor} onChange={e=>update({accentColor:e.target.value})}/></div></div><div className="field"><label>Upload hero image / website visual</label><input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&uploadHero(e.target.files[0])}/>{site.heroImage&&<button className="btn dark" onClick={()=>update({heroImage:''})}>Remove Uploaded Image</button>}</div><div className="field"><label>Video or media link for this website</label><input placeholder="https://youtube.com/... or TikTok/Instagram/Vimeo link" value={site.heroMediaLink||''} onChange={e=>update({heroMediaLink:e.target.value})}/></div><div className="navRow"><button className="btn dark" onClick={back}>Back</button><button className="btn" onClick={next}>Save & Continue</button></div></>}
{step===3&&<><h2>Pages & Wording</h2><p className="mutedText">Free Launch Page publishes Home only. Starter publishes 1 page, Business up to 3 pages, Premium all selected pages. Use the fields below to enter wording for each page/section.</p><div className="notice"><strong>{plans[site.plan]?.label}</strong> includes {plans[site.plan]?.maxPages>=99?'all built-in pages':`${plans[site.plan]?.maxPages} page(s)`}. Extra pages are $10/month per page.</div><h3>Choose pages</h3><div className="templateList">{pageOptions.map(p=><button className={`pick ${site.pages.includes(p)?'active':''}`} key={p} onClick={()=>site.pages.includes(p)?removePage(p):addPage(p)}>{site.pages.includes(p)?'✓ ':''}{p}<br/><small>{sectionPrompts[p]}</small></button>)}</div><h3>Write section wording</h3>{site.pages.map(p=><div className="field" key={p}><label>{p} wording</label><small>{sectionPrompts[p]}</small><textarea value={site.sections?.[p]||''} onChange={e=>update({sections:{...site.sections,[p]:e.target.value}})}/></div>)}<h3>Gallery / media items</h3><p className="mutedText">Use this for Gallery, Portfolio, Products, Menu, Projects, or Before & After pages. Large videos should be links for now.</p><MediaEditor site={site} update={update}/><div className="navRow"><button className="btn dark" onClick={back}>Back</button><button className="btn" onClick={next}>Save & Continue</button></div></>}
{step===4&&<><h2>Preview & Publish</h2>{message&&<div className="notice error">{message}</div>}<p>Your website name will be:</p><div className="notice"><strong>{slugify(site.businessName)}.cookiesdigitalcreations.com</strong></div><button className="btn dark" onClick={saveDraft}>Save Draft First</button>{site.plan==='free'?<button className="btn" onClick={publishFree}>Publish Free Page</button>:<button className="btn" onClick={checkoutPlan}>Go to {plans[site.plan]?.price} Checkout</button>}<div className="navRow"><button className="btn dark" onClick={back}>Back</button></div></>}
</div><div className="previewSticky"><div className="previewTitle"><strong>Live Draft Preview</strong><span>Updates as you build</span></div><SitePreview site={site} draftMode/></div></div></section></main> }

function MediaEditor({site,update}){function add(){update({media:[...(site.media||[]),{kind:'link',url:'',title:''}]})}function set(i,m){const media=[...(site.media||[])];media[i]=m;update({media})}function remove(i){update({media:site.media.filter((_,x)=>x!==i)})}function file(i,file){const r=new FileReader();r.onload=()=>set(i,{kind:'image',url:r.result,title:file.name});r.readAsDataURL(file)}return <div>{(site.media||[]).map((m,i)=><div className="card miniCard" key={i}><div className="row"><input placeholder="Title" value={m.title||''} onChange={e=>set(i,{...m,title:e.target.value})}/><select value={m.kind} onChange={e=>set(i,{...m,kind:e.target.value})}><option value="link">Video/social/media link</option><option value="image">Image upload</option></select></div>{m.kind==='image'?<input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&file(i,e.target.files[0])}/>:<input placeholder="https://youtube.com/..." value={m.url||''} onChange={e=>set(i,{...m,url:e.target.value})}/>}<button className="btn dark" onClick={()=>remove(i)}>Remove</button></div>)}<button className="btn dark" onClick={add}>Add Media</button></div>}
