// Generates the self-contained consent widget JavaScript served by /w.js
// This runs on the CLIENT's website. It renders the banner/modal and posts
// consent events back to the platform API.

import { VENDORS_MAP, TAG_COLORS, LANGUAGES } from './widget-assets'

interface PurposeGroup {
  id: string
  label: string
  description: string
  necessary: boolean
  enabled: boolean
  dataPoints: string[]
}

interface WidgetData {
  clientKey: string
  brandName: string
  primaryColor: string
  position: string
  groups: PurposeGroup[]
  translations: Record<string, Record<string, string>>
  apiBase: string
  preview?: boolean
}

export function generateWidgetJs(d: WidgetData): string {
  const enabledGroups = d.groups.filter((g) => g.enabled)
  return `/* DPDP Consent Widget | ${d.brandName} | DPDP Act 2023 Compliant */
(function(){
  if(window.__dpdpLoaded)return; window.__dpdpLoaded=true;
  var PREVIEW=${d.preview ? 'true' : 'false'};
  var KEY=${JSON.stringify(d.clientKey)};
  var API=${JSON.stringify(d.apiBase)};
  var B={name:${JSON.stringify(d.brandName)},primary:${JSON.stringify(d.primaryColor)}};
  var G=${JSON.stringify(enabledGroups)};
  var V=${JSON.stringify(VENDORS_MAP)};
  var TC=${JSON.stringify(TAG_COLORS)};
  var T=${JSON.stringify(d.translations)};
  var LANGS=${JSON.stringify(LANGUAGES)};
  var lang='en',expanded=null,toggles={},hadConsent=false,sessionId=Math.random().toString(36).slice(2)+Date.now().toString(36);
  G.forEach(function(g){toggles[g.id]=true;});

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
  function t(k){var dd=T[lang]||T['en']||{};return dd[k]||{title:'We value your privacy',body:"We use cookies in compliance with India's DPDP Act 2023.",allowAll:'Accept All',onlyNecessary:'Only Necessary',customise:'Customise',poweredBy:'Protected under DPDP Act 2023'}[k]||k;}

  function logEvent(type,prefs){
    if(PREVIEW)return;
    try{
      fetch(API+'/api/consent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        client_key:KEY,event_type:type,consented_to:prefs||{},language_used:lang,device_type:device(),page_url:location.href,session_id:sessionId
      })});
    }catch(e){}
  }

  function persist(p,et){
    try{localStorage.setItem('dpdp_consent',JSON.stringify({v:1,date:new Date().toISOString(),prefs:p}));}catch(e){}
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

  function renderBanner(){
    var h='<div id="dpdp-banner" style="position:fixed;bottom:20px;'+posCss+';width:300px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);padding:18px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border:1.5px solid #f0f0f0">';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><div style="width:32px;height:32px;border-radius:10px;background:'+B.primary+'18;display:flex;align-items:center;justify-content:center;font-size:16px">🛡️</div>';
    h+='<div style="font-size:12.5px;font-weight:700;color:#111;line-height:1.3">'+t('title')+'</div></div>';
    h+='<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px">';
    LANGS.forEach(function(l){h+='<button onclick="window._dpdpLang(\\''+l[0]+'\\')" style="font-size:8.5px;padding:2px 6px;border-radius:7px;border:1px solid #ddd;background:'+(lang===l[0]?B.primary:'#fff')+';color:'+(lang===l[0]?'#fff':'#666')+';cursor:pointer;font-family:inherit">'+l[1]+'</button>';});
    h+='</div>';
    h+='<p style="font-size:10.5px;color:#555;line-height:1.55;margin-bottom:11px">'+t('body')+'</p>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:13px">';
    G.forEach(function(g){
      var on=g.necessary||toggles[g.id];
      h+='<button onclick="'+(!g.necessary?'window._dpdpToggle(\\''+g.id+'\\')':'')+'" style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:600;padding:4px 9px;border-radius:20px;border:1.5px solid '+(on?B.primary+'60':'#e0e0e0')+';background:'+(on?B.primary+'0d':'#fafafa')+';cursor:'+(g.necessary?'default':'pointer')+';font-family:inherit">';
      h+='<span style="position:relative;width:22px;height:13px;border-radius:7px;background:'+(on?B.primary:'#ccc')+';display:inline-block;flex-shrink:0"><span style="position:absolute;top:1.5px;left:'+(on?'10px':'1.5px')+';width:10px;height:10px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></span>';
      h+='<span style="width:13px;height:13px;border-radius:50%;background:'+(on?B.primary:'#ccc')+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:800;flex-shrink:0">'+(on?'✓':'✕')+'</span>';
      h+=g.label+'</button>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:5px">';
    h+='<button onclick="window._dpdpSave(\\'necessary\\')" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:1.5px solid #ddd;background:#fff;color:#555;cursor:pointer;font-family:inherit">'+t('onlyNecessary')+'</button>';
    h+='<button onclick="window._dpdpModal()" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:1.5px solid '+B.primary+';background:#fff;color:'+B.primary+';cursor:pointer;font-family:inherit">'+t('customise')+'</button>';
    h+='<button onclick="window._dpdpSave(\\'all\\')" style="flex:1;padding:8px 4px;border-radius:9px;font-size:9.5px;font-weight:700;border:none;background:'+B.primary+';color:#fff;cursor:pointer;font-family:inherit">'+t('allowAll')+'</button>';
    h+='</div><div style="margin-top:8px;font-size:8.5px;color:#bbb;text-align:center">🔒 '+t('poweredBy')+'</div></div>';
    return h;
  }

  function renderModal(){
    var h='<div id="dpdp-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000000;align-items:center;justify-content:center;padding:16px">';
    h+='<div style="background:#fff;border-radius:18px;width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">';
    h+='<div style="padding:18px 20px 12px;border-bottom:1px solid #f0f0f0;flex-shrink:0">';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:5px"><div style="width:32px;height:32px;border-radius:10px;background:'+B.primary+'18;display:flex;align-items:center;justify-content:center;font-size:16px">🛡️</div>';
    h+='<div><div style="font-size:14px;font-weight:700;color:#111">'+t('title')+'</div><div style="font-size:10px;color:#777">'+B.name+' · DPDP Act 2023</div></div></div>';
    h+='<p style="font-size:10.5px;color:#555;line-height:1.5">'+t('body')+'</p>';
    h+='<div style="display:flex;align-items:center;gap:5px;background:#f4f3ff;border:1px solid #e0dcff;padding:7px 10px;border-radius:8px;margin-top:7px;font-size:9.5px;color:#555">🇮🇳 Your data is protected under India\\'s Digital Personal Data Protection Act 2023.</div>';
    h+='</div>';
    h+='<div style="overflow-y:auto;flex:1;padding:10px 12px">';
    G.forEach(function(g){
      var on=g.necessary||toggles[g.id];var isOpen=expanded===g.id;var vc=V[g.id]||[];
      h+='<div style="border:1px solid #f0f0f0;border-radius:11px;margin-bottom:7px;overflow:hidden">';
      h+='<div onclick="window._dpdpExpand(\\''+g.id+'\\')" style="display:flex;align-items:center;gap:6px;padding:9px 11px;cursor:pointer;background:#fff">';
      h+='<span style="font-size:8px;font-weight:700;padding:2px 7px;border-radius:10px;'+tc(g.id)+';flex-shrink:0">'+g.label+'</span>';
      h+='<span style="font-size:8px;background:#f3f4f6;color:#555;padding:2px 6px;border-radius:7px;flex-shrink:0">Script tags</span><span style="flex:1"></span>';
      if(g.necessary){h+='<span style="font-size:8.5px;color:#999;font-style:italic;margin-right:4px">Always on</span>';}
      else{h+='<div onclick="event.stopPropagation();window._dpdpToggle(\\''+g.id+'\\')" style="width:34px;height:19px;border-radius:10px;background:'+(on?B.primary:'#ccc')+';position:relative;cursor:pointer;flex-shrink:0"><span style="position:absolute;top:2.5px;left:'+(on?'17px':'3px')+';width:14px;height:14px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span></div>';}
      h+='<span style="font-size:10px;color:#ccc;margin-left:4px">'+(isOpen?'▲':'▼')+'</span></div>';
      if(isOpen){
        h+='<div style="padding:10px 12px 12px;background:#fafafa;border-top:1px solid #f0f0f0">';
        h+='<p style="font-size:10.5px;color:#555;line-height:1.5;margin-bottom:8px">'+g.description+'</p>';
        if(vc.length){h+='<div style="font-size:8.5px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Data Processors</div><table style="width:100%;border-collapse:collapse;font-size:9.5px">';
          vc.forEach(function(v){h+='<tr><td style="padding:4px 0;border-bottom:1px solid #f0f0f0;color:#333">'+v.n+'<span style="background:#eee;color:#555;font-size:8px;padding:1px 5px;border-radius:6px;font-weight:600;margin-left:5px">'+v.c+'</span></td><td style="text-align:right;color:#bbb">↗</td></tr>';});
          h+='</table>';}
        h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:7px">';
        g.dataPoints.forEach(function(dp){h+='<span style="font-size:9px;background:#f0f0f0;color:#555;padding:3px 7px;border-radius:7px">'+dp+'</span>';});
        h+='</div></div>';
      }
      h+='</div>';
    });
    h+='</div>';
    h+='<div style="padding:11px 14px;border-top:1px solid #f0f0f0;display:flex;gap:7px;flex-shrink:0">';
    h+='<button onclick="window._dpdpSave(\\'necessary\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:1.5px solid #ddd;background:#fff;color:#555;cursor:pointer;font-family:inherit">'+t('onlyNecessary')+'</button>';
    h+='<button onclick="window._dpdpSave(\\'selection\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:1.5px solid '+B.primary+';background:#fff;color:'+B.primary+';cursor:pointer;font-family:inherit">'+t('customise')+'</button>';
    h+='<button onclick="window._dpdpSave(\\'all\\')" style="flex:1;padding:9px;border-radius:9px;font-size:10px;font-weight:700;border:none;background:'+B.primary+';color:#fff;cursor:pointer;font-family:inherit">'+t('allowAll')+'</button>';
    h+='</div>';
    // Withdrawal link — shown once consent has been given (DPDP s.6: as easy to withdraw as to give).
    if(hadConsent){h+='<div style="padding:0 14px 12px;text-align:center"><button onclick="window._dpdpWithdraw()" style="background:none;border:none;color:#b91c1c;font-size:10px;text-decoration:underline;cursor:pointer;font-family:inherit">Withdraw all consent</button></div>';}
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
      // Returning visitor: re-apply their saved choice, keep a persistent re-open
      // control so they can change or WITHDRAW consent (DPDP s.6) on any page.
      try{
        var s=JSON.parse(stored);hadConsent=true;
        G.forEach(function(g){toggles[g.id]=s.prefs[g.id]===true;});
        window.DPDPConsent={prefs:s.prefs,hasConsent:function(id){return s.prefs[id]===true;},reopen:function(){show('dpdp-modal');},withdraw:function(){withdraw();}};
        applyConsent(s.prefs);activateScripts(s.prefs);
      }catch(e){}
      var root2=document.createElement('div');root2.id='dpdp-root';
      root2.innerHTML=renderModal()+renderFab();   // no banner, but modal + FAB present
      document.body.appendChild(root2);
      return;
    }
    var root=document.createElement('div');root.id='dpdp-root';
    root.innerHTML=renderBanner()+renderModal()+renderFab();
    document.body.appendChild(root);
    logEvent('shown',{});
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
  window._dpdpToggle=function(id){var g=G.find(function(x){return x.id===id;});if(g&&!g.necessary){toggles[id]=!toggles[id];rerender();}};
  window._dpdpExpand=function(id){expanded=expanded===id?null:id;rerender();};
  window._dpdpLang=function(l){lang=l;rerender();};
  window.DPDPConsent=window.DPDPConsent||{reset:function(){try{localStorage.removeItem('dpdp_consent');}catch(e){}location.reload();}};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();`
}
