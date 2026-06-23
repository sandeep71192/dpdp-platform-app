// Generates the self-contained consent widget JavaScript served by /w.js
// This runs on the CLIENT's website. It renders the banner/modal and posts
// consent events back to the platform API.

import { VENDORS_MAP, TAG_COLORS, LANGUAGES } from './widget-assets'

interface Tracker {
  name: string
  domain: string
  platform: string
  provider: string
  expiration: string
  description: string
  privacyUrl: string
}

interface PurposeGroup {
  id: string
  label: string
  description: string
  necessary: boolean
  enabled: boolean
  dataPoints: string[]
  trackers?: Tracker[]
}

interface WidgetData {
  clientKey: string
  brandName: string
  primaryColor: string
  position: string
  font?: string
  layout?: string
  heroImage?: string
  groups: PurposeGroup[]
  translations: Record<string, Record<string, string>>
  apiBase: string
  grievanceEmail?: string
  preview?: boolean
}

// Fingerprint of the consent-MATERIAL content only — the purposes a visitor is
// agreeing to and the notice text describing them. Cosmetic config (colour,
// position, font, layout) is deliberately excluded so a visual tweak does NOT
// invalidate everyone's consent. When this string changes, prior consent is
// treated as stale and the widget re-prompts (DPDP: consent is purpose-specific,
// so a material change to purposes/notice requires fresh consent).
function policyFingerprint(groups: PurposeGroup[], translations: WidgetData['translations']): string {
  const material = groups.map((g) => ({
    id: g.id,
    label: g.label,
    necessary: g.necessary,
    dataPoints: g.dataPoints,
    trackers: (g.trackers || []).map((t) => t.name),
  }))
  const str = JSON.stringify({ groups: material, notice: translations })
  // djb2 string hash → short stable token; no crypto dependency needed.
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function generateWidgetJs(d: WidgetData): string {
  const enabledGroups = d.groups.filter((g) => g.enabled)
  const policyVersion = policyFingerprint(enabledGroups, d.translations)
  return `/* DPDP Consent Widget | ${d.brandName} | DPDP Act 2023 Compliant */
(function(){
  if(window.__dpdpLoaded)return; window.__dpdpLoaded=true;
  var PREVIEW=${d.preview ? 'true' : 'false'};
  var KEY=${JSON.stringify(d.clientKey)};
  // Policy fingerprint — bumps when purposes/notice change; drives re-consent.
  var PV=${JSON.stringify(policyVersion)};
  var API=${JSON.stringify(d.apiBase)};
  var B={name:${JSON.stringify(d.brandName)},primary:${JSON.stringify(d.primaryColor)}};
  // Typography: default inherits the host page's font ("match my site"); a stored
  // override is a real CSS font stack. Inner elements use font-family:inherit, so
  // setting FONT on the banner/modal root cascades everywhere.
  var FONT=${JSON.stringify(d.font && d.font !== 'inherit' ? d.font : 'inherit')};
  // Layout variant: 'card' (floating corner card), 'bar' (full-width bottom bar),
  // or 'pill' (compact badge that expands to the card on click).
  var LAYOUT=${JSON.stringify(d.layout || 'card')};
  // Optional brand-uploaded hero image URL; when empty the card renders a brand-tinted
  // procedural SVG instead (no network request, works for every brand automatically).
  var HERO=${JSON.stringify(d.heroImage || '')};
  var bannerOpen=LAYOUT!=='pill';   // pill starts collapsed
  var GRIEV=${JSON.stringify(d.grievanceEmail || '')};
  var G=${JSON.stringify(enabledGroups)};
  var V=${JSON.stringify(VENDORS_MAP)};
  var TC=${JSON.stringify(TAG_COLORS)};
  var T=${JSON.stringify(d.translations)};
  var LANGS=${JSON.stringify(LANGUAGES)};
  // Locale auto-detect: pick the visitor's language from a prior manual choice, else
  // from the browser's language settings, falling back to English. Only languages we
  // actually have copy for (present in LANGS *and* the translations dict) are eligible,
  // so a partially-translated config never shows blank strings.
  function detectLang(){
    var supported={};LANGS.forEach(function(l){if(T[l[0]])supported[l[0]]=1;});
    try{var saved=localStorage.getItem('dpdp_lang');if(saved&&supported[saved])return saved;}catch(e){}
    var prefs=[];
    try{if(navigator.languages&&navigator.languages.length)prefs=navigator.languages.slice();}catch(e){}
    try{if(navigator.language)prefs.push(navigator.language);}catch(e){}
    for(var i=0;i<prefs.length;i++){var code=String(prefs[i]||'').toLowerCase().split('-')[0];if(supported[code])return code;}
    return 'en';
  }
  var lang=detectLang(),expanded=null,activeCat=null,toggles={},hadConsent=false,policyUpdated=false,sessionId=Math.random().toString(36).slice(2)+Date.now().toString(36);
  // DPDP s.6(1): consent needs a clear affirmative action — nothing non-essential
  // may be pre-ticked. Only genuinely necessary purposes start ON; the rest are OFF
  // until the user switches them on (or taps "Accept All").
  G.forEach(function(g){toggles[g.id]=!!g.necessary;});
  // When every purpose is essential, "Only necessary" and "Accept all" are the SAME
  // action — showing both renders two identical buttons. Collapse to a single accept.
  var allEss=G.length>0&&G.every(function(g){return g.necessary;});
  // Mobile-first: on phones the banner becomes a full-width bottom sheet and the
  // preference centre goes full-screen, with larger touch targets. Re-evaluated on
  // every render, and a resize listener re-renders on rotation/resize.
  function isMobile(){try{return window.matchMedia('(max-width:480px)').matches;}catch(e){return (window.innerWidth||999)<=480;}}
  var SAFE='env(safe-area-inset-bottom,0px)';

  // ---- Consent enforcement (DPDP s.4/s.6): block non-essential processing until opt-in ----
  // Map our purpose groups to Google Consent Mode v2 signals.
  var CM_MAP={
    essential:['security_storage'],
    analytics:['analytics_storage'],
    marketing:['ad_storage','ad_user_data','ad_personalization'],
    functional:['functionality_storage','personalization_storage']
  };
  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments);}
  // Push DENIED defaults immediately so Google tags loaded later respect them.
  function consentDefaults(){
    if(PREVIEW)return;
    var d={ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500};
    try{gtag('consent','default',d);}catch(e){}
  }
  // Translate granted prefs into a Consent Mode update.
  function applyConsent(prefs){
    if(PREVIEW)return;
    var u={};
    Object.keys(CM_MAP).forEach(function(gid){
      var granted=prefs[gid]===true; CM_MAP[gid].forEach(function(sig){ u[sig]=granted?'granted':'denied'; });
    });
    u.security_storage='granted';
    try{gtag('consent','update',u);}catch(e){}
  }
  // Activate brand tags that were parked behind consent:
  //   <script type="text/plain" data-dpdp-purpose="analytics">...</script>
  function activateScripts(prefs){
    if(PREVIEW)return;
    var nodes=document.querySelectorAll('script[type="text/plain"][data-dpdp-purpose]');
    for(var i=0;i<nodes.length;i++){
      var old=nodes[i];var purpose=old.getAttribute('data-dpdp-purpose');
      if(prefs[purpose]!==true||old.getAttribute('data-dpdp-activated'))continue;
      var s=document.createElement('script');
      for(var a=0;a<old.attributes.length;a++){var at=old.attributes[a];if(at.name==='type'||at.name==='data-dpdp-purpose')continue;s.setAttribute(at.name,at.value);}
      if(old.src)s.src=old.src;else s.text=old.textContent;
      old.setAttribute('data-dpdp-activated','1');
      old.parentNode.insertBefore(s,old.nextSibling);
    }
  }

  function device(){var w=window.innerWidth;return w<768?'mobile':w<1024?'tablet':'desktop';}
  function t(k){var dd=T[lang]||T['en']||{};return dd[k]||{title:'We value your privacy',body:"We use cookies in compliance with India's DPDP Act 2023.",allowAll:'Accept All',onlyNecessary:'Only Necessary',customise:'Customise',poweredBy:'Protected under DPDP Act 2023',updatedNotice:"We've updated our privacy choices — please review and confirm."}[k]||k;}

  function logEvent(type,prefs){
    if(PREVIEW)return;
    try{
      fetch(API+'/api/consent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        client_key:KEY,event_type:type,consented_to:prefs||{},language_used:lang,device_type:device(),page_url:location.href,session_id:sessionId
      })});
    }catch(e){}
  }

  function persist(p,et){
    try{localStorage.setItem('dpdp_consent',JSON.stringify({v:1,pv:PV,date:new Date().toISOString(),prefs:p}));}catch(e){}
    window.DPDPConsent={prefs:p,hasConsent:function(id){return p[id]===true;},reopen:function(){show('dpdp-modal');},withdraw:function(){withdraw();}};
    applyConsent(p);            // tell Google Consent Mode what's now allowed
    activateScripts(p);         // run any parked brand tags that are now consented
    document.dispatchEvent(new CustomEvent('dpdp:consent',{detail:p}));
    hadConsent=true;
    if(!PREVIEW)logEvent(et,p);
  }
  function save(type){
    if(PREVIEW){hide('dpdp-banner');hide('dpdp-modal');return;}
    var p={};
    if(type==='all')G.forEach(function(g){p[g.id]=true;});
    else if(type==='necessary')G.forEach(function(g){p[g.id]=g.necessary;});
    else G.forEach(function(g){p[g.id]=toggles[g.id];});
    var et=type==='all'?'accepted_all':type==='necessary'?'rejected_all':'customised';
    persist(p,et);
    hide('dpdp-banner');hide('dpdp-modal');
  }
  // DPDP s.6: withdrawal must be as easy as giving consent.
  function withdraw(){
    if(PREVIEW)return;
    var p={};G.forEach(function(g){p[g.id]=g.necessary;});   // keep only essential
    G.forEach(function(g){toggles[g.id]=g.necessary;});
    persist(p,'withdrawn');
    rerender();hide('dpdp-banner');hide('dpdp-modal');
  }

  function hide(id){var el=document.getElementById(id);if(el)el.style.display='none';}
  function show(id){var el=document.getElementById(id);if(el)el.style.display='flex';}
  function tc(id){var c=TC[id]||{bg:'#f3f4f6',text:'#374151'};return 'background:'+c.bg+';color:'+c.text;}
  var POS=${JSON.stringify(d.position)};
  var posCss=POS==='bottom-left'?'left:20px':POS==='bottom-center'?'left:50%;transform:translateX(-50%)':'right:20px';

  // Brand-tinted procedural hero — flat layered abstract, recoloured from B.primary.
  function heroSvg(){
    var p=B.primary;
    return '<svg viewBox="0 0 320 140" width="100%" height="140" preserveAspectRatio="xMidYMid slice" style="display:block" aria-hidden="true">'
      +'<rect width="320" height="140" fill="'+p+'10"/>'
      +'<circle cx="250" cy="32" r="17" fill="#ffffff" opacity="0.6"/>'
      +'<path d="M0 104 Q48 64 96 86 Q132 102 162 84 Q202 60 244 88 Q282 110 320 86 L320 140 L0 140 Z" fill="'+p+'2e"/>'
      +'<path d="M0 120 Q50 92 104 108 Q158 124 210 104 Q262 86 320 108 L320 140 L0 140 Z" fill="'+p+'55"/>'
      +'<ellipse cx="78" cy="92" rx="21" ry="15" fill="'+p+'44"/>'
      +'<ellipse cx="224" cy="98" rx="17" ry="12" fill="'+p+'33"/>'
      +'<ellipse cx="42" cy="129" rx="25" ry="8" fill="#ffffff" opacity="0.5"/>'
      +'<ellipse cx="268" cy="131" rx="29" ry="9" fill="#ffffff" opacity="0.5"/>'
      +'</svg>';
  }
  function renderHero(){
    var inner=HERO?'<img src="'+HERO+'" alt="" style="width:100%;height:140px;object-fit:cover;display:block">':heroSvg();
    return '<div style="width:100%;line-height:0">'+inner+'</div>';
  }

  function renderBanner(){
    // Compact-pill collapsed state: a small badge that expands to the full card on click.
    if(LAYOUT==='pill'&&!bannerOpen){
      return '<button id="dpdp-banner" onclick="window._dpdpOpenBanner()" style="position:fixed;bottom:20px;'+posCss+';display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #f0f0f0;border-radius:24px;box-shadow:0 6px 24px rgba(0,0,0,0.16);padding:9px 16px 9px 12px;z-index:999999;font-family:'+FONT+';font-size:12px;font-weight:600;color:#333;cursor:pointer"><span style="width:24px;height:24px;border-radius:8px;background:'+B.primary+'18;display:inline-flex;align-items:center;justify-content:center;font-size:13px">🛡️</span>'+t('title')+'</button>';
    }
    // 'bar' stays a compact full-width strip; everything else (card/pill on desktop, and
    // ALL layouts on mobile) uses the clean hero-card styling.
    var isBar=LAYOUT==='bar';
    var mob=isMobile();
    var clean=mob||!isBar;
    var pad=mob?'18px 18px calc(18px + '+SAFE+')':'18px';
    var cont;
    if(mob){
      cont='position:fixed;left:0;right:0;bottom:0;width:auto;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -8px 40px rgba(0,0,0,0.18);z-index:999999;font-family:'+FONT+';border-top:1.5px solid #f0f0f0;max-height:92vh;overflow-y:auto;overflow-x:hidden';
    }else if(isBar){
      cont='position:fixed;left:0;right:0;bottom:0;width:auto;background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -6px 40px rgba(0,0,0,0.14);padding:16px max(20px,calc((100% - 880px)/2));z-index:999999;font-family:'+FONT+';border-top:1.5px solid #f0f0f0';
    }else{
      cont='position:fixed;bottom:20px;'+posCss+';width:320px;background:#fff;border-radius:22px;box-shadow:0 12px 48px rgba(0,0,0,0.18);z-index:999999;font-family:'+FONT+';border:0.5px solid #ececef;overflow:hidden';
    }
    var h='<div id="dpdp-banner" style="'+cont+'">';
    if(clean)h+=renderHero();
    h+='<div style="padding:'+(clean?pad:'0')+'">';
    // Title
    if(clean){
      h+='<div style="font-size:17px;font-weight:600;color:#16161d;letter-spacing:-0.01em;margin-bottom:4px">'+t('title')+'</div>';
    }else{
      h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><div style="width:32px;height:32px;border-radius:10px;background:'+B.primary+'18;display:flex;align-items:center;justify-content:center;font-size:16px">🛡️</div><div style="font-size:12.5px;font-weight:700;color:#111;line-height:1.3">'+t('title')+'</div></div>';
    }
    // Re-consent note — only when a prior consent was invalidated by a policy change.
    if(policyUpdated){h+='<div style="display:flex;gap:6px;align-items:flex-start;background:'+B.primary+'0d;border:1px solid '+B.primary+'30;border-radius:9px;padding:7px 9px;margin-bottom:9px"><span style="font-size:11px;flex-shrink:0">🔔</span><span style="font-size:'+(clean?'11px':'9.5px')+';color:#444;line-height:1.45">'+t('updatedNotice')+'</span></div>';}
    h+='<p style="font-size:'+(clean?'13px':'10.5px')+';color:'+(clean?'#8a8a93':'#555')+';line-height:1.5;margin:0 0 '+(clean?'14px':'11px')+'">'+t('body')+'</p>';
    // Language
    if(clean){
      h+='<div style="margin-bottom:12px"><select onchange="window._dpdpLang(this.value)" style="width:100%;font-size:13px;padding:10px 11px;border-radius:12px;border:0.5px solid #e3e3e8;background:#fff;color:#333;font-family:inherit">';
      LANGS.forEach(function(l){h+='<option value="'+l[0]+'"'+(lang===l[0]?' selected':'')+'>'+l[1]+'</option>';});
      h+='</select></div>';
    }else{
      h+='<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px">';
      LANGS.forEach(function(l){h+='<button onclick="window._dpdpLang(\\''+l[0]+'\\')" style="font-size:8.5px;padding:2px 6px;border-radius:7px;border:1px solid #ddd;background:'+(lang===l[0]?B.primary:'#fff')+';color:'+(lang===l[0]?'#fff':'#666')+';cursor:pointer;font-family:inherit">'+l[1]+'</button>';});
      h+='</div>';
    }
    // Purpose toggles
    h+='<div style="display:flex;'+(clean?'flex-direction:column;gap:8px':'flex-wrap:wrap;gap:5px')+';margin-bottom:'+(clean?'16px':'13px')+'">';
    G.forEach(function(g){
      var on=g.necessary||toggles[g.id];
      if(clean){
        h+='<button onclick="'+(!g.necessary?'window._dpdpToggle(\\''+g.id+'\\')':'')+'" style="display:flex;align-items:center;gap:10px;width:100%;font-size:13.5px;font-weight:500;padding:11px 12px;border-radius:14px;border:0.5px solid '+(on?B.primary+'66':'#ececef')+';background:'+(on?B.primary+'0d':'#fff')+';cursor:'+(g.necessary?'default':'pointer')+';font-family:inherit;text-align:left">';
        h+='<span style="position:relative;width:42px;height:25px;border-radius:13px;background:'+(on?B.primary:'#e3e3e8')+';display:inline-block;flex-shrink:0"><span style="position:absolute;top:2.5px;left:'+(on?'19px':'2.5px')+';width:20px;height:20px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></span>';
        h+='<span style="flex:1;color:#16161d">'+g.label+'</span>';
        if(g.necessary)h+='<span style="font-size:11px;color:#a0a0a8">Always on</span>';
        h+='</button>';
      }else{
        h+='<button onclick="'+(!g.necessary?'window._dpdpToggle(\\''+g.id+'\\')':'')+'" style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:600;padding:4px 9px;border-radius:20px;border:1.5px solid '+(on?B.primary+'60':'#e0e0e0')+';background:'+(on?B.primary+'0d':'#fafafa')+';cursor:'+(g.necessary?'default':'pointer')+';font-family:inherit">';
        h+='<span style="position:relative;width:22px;height:13px;border-radius:7px;background:'+(on?B.primary:'#ccc')+';display:inline-block;flex-shrink:0"><span style="position:absolute;top:1.5px;left:'+(on?'10px':'1.5px')+';width:10px;height:10px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></span>';
        h+='<span style="width:13px;height:13px;border-radius:50%;background:'+(on?B.primary:'#ccc')+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:800;flex-shrink:0">'+(on?'✓':'✕')+'</span>';
        h+=g.label+'</button>';
      }
    });
    h+='</div>';
    // Actions
    if(clean){
      h+='<button onclick="window._dpdpSave(\\'all\\')" style="width:100%;min-height:48px;padding:12px;border-radius:15px;font-size:15px;font-weight:600;border:none;background:'+B.primary+';color:#fff;cursor:pointer;font-family:inherit;margin-bottom:9px">'+t('allowAll')+'</button>';
      h+='<div style="display:flex;gap:8px">';
      if(!allEss)h+='<button onclick="window._dpdpSave(\\'necessary\\')" style="flex:1;min-height:44px;padding:11px;border-radius:14px;font-size:13px;font-weight:500;border:0.5px solid #e3e3e8;background:#fff;color:#5a5a63;cursor:pointer;font-family:inherit">'+t('onlyNecessary')+'</button>';
      h+='<button onclick="window._dpdpModal()" style="flex:1;min-height:44px;padding:11px;border-radius:14px;font-size:13px;font-weight:500;border:0.5px solid #e3e3e8;background:#fff;color:#5a5a63;cursor:pointer;font-family:inherit">'+t('customise')+'</button>';
      h+='</div>';
      h+='<div style="margin-top:13px;font-size:11px;color:#b6b6bd;text-align:center">🔒 '+t('poweredBy')+'</div>';
    }else{
      h+='<div style="display:flex;gap:5px">';
      if(!allEss)h+='<button onclick="window._dpdpSave(\\'necessary\\')" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:1.5px solid #ddd;background:#fff;color:#555;cursor:pointer;font-family:inherit">'+t('onlyNecessary')+'</button>';
      h+='<button onclick="window._dpdpModal()" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:1.5px solid '+B.primary+';background:#fff;color:'+B.primary+';cursor:pointer;font-family:inherit">'+t('customise')+'</button>';
      h+='<button onclick="window._dpdpSave(\\'all\\')" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:none;background:'+B.primary+';color:#fff;cursor:pointer;font-family:inherit">'+t('allowAll')+'</button>';
      h+='</div>';
      h+='<div style="margin-top:8px;font-size:8.5px;color:#bbb;text-align:center">🔒 '+t('poweredBy')+'</div>';
    }
    h+='</div></div>';
    return h;
  }

  // Itemised cookie/tracker card (DPDP s.5 itemised notice; s.11 recipients).
  function trackerCard(tr){
    var h='<div style="border:1px solid #eee;border-radius:10px;padding:9px 11px;margin-bottom:6px;background:#fff">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;font-weight:700;color:#111;word-break:break-all">'+tr.name+'</span><span style="flex:1"></span><span style="font-size:8px;font-weight:700;background:'+B.primary+'14;color:'+B.primary+';padding:2px 7px;border-radius:9px;flex-shrink:0">'+tr.provider+'</span></div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px">';
    if(tr.platform){h+='<span style="font-size:8.5px;background:#f3f4f6;color:#555;padding:2px 7px;border-radius:6px">'+tr.platform+'</span>';}
    if(tr.domain){h+='<span style="font-size:8.5px;background:#f3f4f6;color:#555;padding:2px 7px;border-radius:6px">'+tr.domain+'</span>';}
    if(tr.expiration){h+='<span style="font-size:8.5px;background:#f3f4f6;color:#555;padding:2px 7px;border-radius:6px">⏱ '+tr.expiration+'</span>';}
    h+='</div>';
    h+='<p style="font-size:10px;color:#555;line-height:1.5;margin:0">'+tr.description+'</p>';
    if(tr.privacyUrl){h+='<a href="'+tr.privacyUrl+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;font-size:9px;color:'+B.primary+';text-decoration:underline">Provider privacy policy ↗</a>';}
    return h+'</div>';
  }

  function renderDataProtectionPanel(){
    var h='<div style="font-size:11px;color:#333;line-height:1.6">';
    h+='<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:6px">Data protection at '+B.name+'</div>';
    h+='<p style="font-size:10.5px;color:#555;margin:0 0 10px">Your information is handled by <b>'+B.name+'</b>, the business you\\'re buying from — the “Data Fiduciary” under India\\'s DPDP Act 2023. We collect only what we need, keep it secure, and never sell it.</p>';
    h+='<div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Your rights</div>';
    var rights=[['See your data','Ask what we hold about you and why.'],['Fix it','Correct or complete anything that\\'s wrong.'],['Delete it','Ask us to erase your data when it\\'s no longer needed.'],['Withdraw consent','Change your mind anytime — as easy as giving it.'],['Nominate','Name someone to act for you if you can\\'t.']];
    rights.forEach(function(r){h+='<div style="display:flex;gap:7px;margin-bottom:5px"><span style="color:'+B.primary+';font-weight:700;flex-shrink:0">•</span><span style="font-size:10px;color:#444"><b>'+r[0]+'</b> — '+r[1]+'</span></div>';});
    h+='<div style="background:#fafafa;border:1px solid #f0f0f0;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:10px;color:#555;line-height:1.6">';
    h+='<b style="color:#111">Questions or complaints</b><br>For any privacy query or to exercise a right';
    if(GRIEV){h+=', email <a href="mailto:'+GRIEV+'" style="color:'+B.primary+';text-decoration:underline">'+GRIEV+'</a>';}
    h+='. If we don\\'t resolve it, you can complain to the <b>Data Protection Board of India</b>.</div>';
    return h+'</div>';
  }

  function renderModal(){
    var groups=G;var ac=activeCat||(groups[0]&&groups[0].id)||'__dp';
    var mob=isMobile();
    var h='<div id="dpdp-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000000;align-items:'+(mob?'stretch':'center')+';justify-content:center;padding:'+(mob?'0':'16px')+';font-family:'+FONT+'">';
    h+='<div style="background:#fff;'+(mob?'border-radius:0;width:100%;max-width:none;height:100%;max-height:100vh':'border-radius:18px;width:100%;max-width:680px;max-height:88vh')+';display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">';
    // Header
    h+='<div style="padding:16px 18px 12px;border-bottom:1px solid #f0f0f0;flex-shrink:0">';
    h+='<div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:10px;background:'+B.primary+'18;display:flex;align-items:center;justify-content:center;font-size:16px">🛡️</div>';
    h+='<div style="flex:1"><div style="font-size:14px;font-weight:700;color:#111">'+t('title')+'</div><div style="font-size:10px;color:#777">'+B.name+' · DPDP Act 2023</div></div>';
    h+='<button onclick="window._dpdpClose()" aria-label="Close" style="background:none;border:none;font-size:18px;color:#bbb;cursor:pointer;line-height:1">×</button></div>';
    h+='<p style="font-size:10.5px;color:#555;line-height:1.5;margin:8px 0 0">'+t('body')+'</p></div>';
    // Body: two-pane on desktop, stacked (tab strip on top) on mobile.
    h+='<div style="display:flex;'+(mob?'flex-direction:column':'')+';flex:1;min-height:0">';
    var dpsel=ac==='__dp';
    if(mob){
      // Horizontal scrolling tab strip.
      h+='<div style="display:flex;gap:7px;overflow-x:auto;padding:11px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0">';
      groups.forEach(function(g){
        var sel=ac===g.id;
        h+='<button onclick="window._dpdpTab(\\''+g.id+'\\')" style="white-space:nowrap;font-size:12px;font-weight:500;padding:7px 13px;border-radius:18px;border:none;background:'+(sel?B.primary:'#f3f3f5')+';color:'+(sel?'#fff':'#555')+';cursor:pointer;font-family:inherit">'+g.label+'</button>';
      });
      h+='<button onclick="window._dpdpTab(\\'__dp\\')" style="white-space:nowrap;font-size:12px;font-weight:500;padding:7px 13px;border-radius:18px;border:none;background:'+(dpsel?B.primary:'#f3f3f5')+';color:'+(dpsel?'#fff':'#555')+';cursor:pointer;font-family:inherit">Your rights</button>';
      h+='</div>';
    }else{
      // Left nav
      h+='<div style="width:148px;flex-shrink:0;border-right:1px solid #f0f0f0;overflow-y:auto;padding:8px;background:#fafafa">';
      groups.forEach(function(g){
        var sel=ac===g.id;var on=g.necessary||toggles[g.id];
        h+='<button onclick="window._dpdpTab(\\''+g.id+'\\')" style="display:flex;align-items:center;gap:6px;width:100%;text-align:left;padding:8px 9px;margin-bottom:3px;border:none;border-radius:9px;background:'+(sel?'#fff':'transparent')+';box-shadow:'+(sel?'0 1px 3px rgba(0,0,0,.08)':'none')+';cursor:pointer;font-family:inherit">';
        h+='<span style="width:6px;height:6px;border-radius:50%;background:'+(g.necessary?'#9ca3af':(on?'#16a34a':'#d1d5db'))+';flex-shrink:0"></span>';
        h+='<span style="font-size:10.5px;font-weight:'+(sel?'700':'500')+';color:'+(sel?'#111':'#555')+';line-height:1.2">'+g.label+'</span></button>';
      });
      h+='<div style="height:1px;background:#e8e8e8;margin:7px 4px"></div>';
      h+='<button onclick="window._dpdpTab(\\'__dp\\')" style="display:block;width:100%;text-align:left;padding:8px 9px;border:none;border-radius:9px;background:'+(dpsel?'#fff':'transparent')+';box-shadow:'+(dpsel?'0 1px 3px rgba(0,0,0,.08)':'none')+';cursor:pointer;font-family:inherit;font-size:10.5px;font-weight:'+(dpsel?'700':'500')+';color:'+(dpsel?'#111':'#555')+'">Data Protection Info</button>';
      h+='</div>';
    }
    // Content pane
    h+='<div style="flex:1;overflow-y:auto;padding:14px 16px;min-width:0">';
    if(ac==='__dp'){
      h+=renderDataProtectionPanel();
    } else {
      var g=null;for(var i=0;i<groups.length;i++){if(groups[i].id===ac)g=groups[i];}
      if(g){
        var on=g.necessary||toggles[g.id];
        h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="flex:1"><div style="font-size:14px;font-weight:700;color:#111">'+g.label+'</div></div>';
        if(g.necessary){h+='<span style="font-size:9px;font-weight:700;color:#16a34a;background:#dcfce7;padding:3px 9px;border-radius:9px">Always on</span>';}
        else{h+='<div onclick="window._dpdpToggle(\\''+g.id+'\\')" style="width:40px;height:22px;border-radius:11px;background:'+(on?B.primary:'#ccc')+';position:relative;cursor:pointer;flex-shrink:0"><span style="position:absolute;top:2.5px;left:'+(on?'20px':'3px')+';width:17px;height:17px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></div>';}
        h+='</div>';
        h+='<p style="font-size:11px;color:#555;line-height:1.6;margin:0 0 12px">'+g.description+'</p>';
        var trk=g.trackers||[];
        if(trk.length){
          h+='<div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">Cookies & trackers ('+trk.length+')</div>';
          trk.forEach(function(tr){h+=trackerCard(tr);});
        } else {
          h+='<div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">What we collect</div><div style="display:flex;flex-wrap:wrap;gap:5px">';
          g.dataPoints.forEach(function(dp){h+='<span style="font-size:9.5px;background:#f3f4f6;color:#555;padding:4px 9px;border-radius:7px">'+dp+'</span>';});
          h+='</div>';
        }
      }
    }
    h+='</div></div>';
    // Footer actions
    h+='<div style="padding:11px 14px;border-top:1px solid #f0f0f0;display:flex;gap:7px;flex-shrink:0">';
    if(!allEss){
      h+='<button onclick="window._dpdpSave(\\'necessary\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:1.5px solid #ddd;background:#fff;color:#555;cursor:pointer;font-family:inherit">'+t('onlyNecessary')+'</button>';
      h+='<button onclick="window._dpdpSave(\\'selection\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:1.5px solid '+B.primary+';background:#fff;color:'+B.primary+';cursor:pointer;font-family:inherit">'+t('customise')+'</button>';
    }
    h+='<button onclick="window._dpdpSave(\\'all\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:none;background:'+B.primary+';color:#fff;cursor:pointer;font-family:inherit">'+t('allowAll')+'</button>';
    h+='</div>';
    // Grievance redressal + complaint route (DPDP s.5 notice / s.13 grievance, Rules 2025).
    // Always present so consumers can exercise rights and escalate to the Board.
    h+='<div style="padding:9px 14px 4px;text-align:center;font-size:9px;color:#888;line-height:1.5">';
    h+='For privacy queries or to exercise your data rights';
    if(GRIEV){h+=', contact <a href="mailto:'+GRIEV+'" style="color:'+B.primary+';text-decoration:underline">'+GRIEV+'</a>';}
    h+='. You may also lodge a grievance with the <span style="color:#555">Data Protection Board of India</span>.</div>';
    // Withdrawal link — shown once consent has been given (DPDP s.6: as easy to withdraw as to give).
    if(hadConsent){h+='<div style="padding:2px 14px 12px;text-align:center"><button onclick="window._dpdpWithdraw()" style="background:none;border:none;color:#b91c1c;font-size:10px;text-decoration:underline;cursor:pointer;font-family:inherit">Withdraw all consent</button></div>';}
    h+='</div></div>';
    return h;
  }

  // Persistent control so consent can be reviewed/withdrawn at any time (DPDP s.6).
  function renderFab(){return '<button id="dpdp-fab" aria-label="Manage privacy consent" title="Manage your privacy choices" onclick="window._dpdpModal()" style="position:fixed;bottom:20px;'+posCss+';width:44px;height:44px;border-radius:50%;background:'+B.primary+';color:#fff;border:none;font-size:20px;cursor:pointer;z-index:999998;box-shadow:0 4px 16px rgba(0,0,0,.25)">🛡️</button>';}

  function getStored(){try{return localStorage.getItem('dpdp_consent');}catch(e){return null;}}
  function mount(){
    consentDefaults();   // deny non-essential before any tag fires (enforcement)
    var stored=PREVIEW?null:getStored();
    if(stored){
      var s=null;try{s=JSON.parse(stored);}catch(e){}
      // Re-consent on policy change: if the stored consent was given against an
      // older policy fingerprint, the purposes/notice have materially changed, so
      // that consent is no longer valid (DPDP: consent is purpose-specific). Fall
      // through to a fresh banner instead of silently honouring the stale choice.
      // Enforcement stays denied (consentDefaults above) until the visitor re-acts.
      var policyChanged=!s||s.pv!==PV;
      if(s&&!policyChanged){
        // Returning visitor, policy unchanged: re-apply their saved choice and keep
        // a persistent re-open control so they can change/WITHDRAW consent (s.6).
        hadConsent=true;
        G.forEach(function(g){toggles[g.id]=s.prefs[g.id]===true;});
        window.DPDPConsent={prefs:s.prefs,hasConsent:function(id){return s.prefs[id]===true;},reopen:function(){show('dpdp-modal');},withdraw:function(){withdraw();}};
        applyConsent(s.prefs);activateScripts(s.prefs);
        var root2=document.createElement('div');root2.id='dpdp-root';
        root2.innerHTML=renderModal()+renderFab();   // no banner, but modal + FAB present
        document.body.appendChild(root2);
        return;
      }
      // Policy changed — re-prompt. Surface a short "updated" note above the banner.
      policyUpdated=true;
    }
    var root=document.createElement('div');root.id='dpdp-root';
    root.innerHTML=renderBanner()+renderModal()+renderFab();
    document.body.appendChild(root);
    logEvent(policyUpdated?'reconsent_required':'shown',{});
  }

  function rerender(){
    var r=document.getElementById('dpdp-root');if(!r)return;
    var open=document.getElementById('dpdp-modal')&&document.getElementById('dpdp-modal').style.display==='flex';
    r.innerHTML=renderBanner()+renderModal()+renderFab();
    if(open)document.getElementById('dpdp-modal').style.display='flex';
  }

  window._dpdpSave=function(type){save(type);};
  window._dpdpWithdraw=function(){withdraw();};
  window._dpdpModal=function(){show('dpdp-modal');};
  window._dpdpClose=function(){hide('dpdp-modal');};
  window._dpdpTab=function(id){activeCat=id;rerender();};
  window._dpdpToggle=function(id){var g=G.find(function(x){return x.id===id;});if(g&&!g.necessary){toggles[id]=!toggles[id];rerender();}};
  window._dpdpExpand=function(id){expanded=expanded===id?null:id;rerender();};
  window._dpdpLang=function(l){lang=l;try{localStorage.setItem('dpdp_lang',l);}catch(e){}rerender();};
  window._dpdpOpenBanner=function(){bannerOpen=true;rerender();};
  window.DPDPConsent=window.DPDPConsent||{reset:function(){try{localStorage.removeItem('dpdp_consent');}catch(e){}location.reload();}};

  // Re-render when crossing the mobile breakpoint (rotation/resize), so the bottom
  // sheet ↔ corner card and full-screen ↔ two-pane swap correctly.
  var _wasMobile=isMobile(),_rt;
  window.addEventListener('resize',function(){
    clearTimeout(_rt);
    _rt=setTimeout(function(){var m=isMobile();if(m!==_wasMobile){_wasMobile=m;if(document.getElementById('dpdp-root'))rerender();}},180);
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();`
}
