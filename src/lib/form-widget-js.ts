// Generates the FORM-CONSENT widget served at /f.js — the second, identity-keyed widget.
// It attaches to a brand's data-collection forms and takes Section 5 notice + Section 6
// (unbundled, unticked) consent for EXPLICIT data the shopper submits (email / phone),
// then records it against that contactable identity via /api/consent/record.
//
// Brand integration:
//   <script src="https://APP/f.js?id=CLIENT_KEY"></script>
//   <form data-dpdp-form
//         data-dpdp-purposes="email_marketing:Email me offers & updates,whatsapp:WhatsApp order updates">
//     <input type="email" name="email" data-dpdp-identity />   <!-- or type=tel for phone -->
//     ...
//     <button type="submit">Sign up</button>
//   </form>

interface FormWidgetData {
  clientKey: string
  brandName: string
  primaryColor: string
  apiBase: string
  grievanceEmail?: string
  preview?: boolean
}

export function generateFormWidgetJs(d: FormWidgetData): string {
  return `/* DPDP Form-Consent Widget | ${d.brandName} | DPDP Act 2023 */
(function(){
  if(window.__dpdpFormsLoaded)return; window.__dpdpFormsLoaded=true;
  var KEY=${JSON.stringify(d.clientKey)};
  var API=${JSON.stringify(d.apiBase)};
  var BRAND=${JSON.stringify(d.brandName)};
  var P=${JSON.stringify(d.primaryColor)};
  var GRIEV=${JSON.stringify(d.grievanceEmail || '')};
  var PREVIEW=${d.preview ? 'true' : 'false'};

  function parsePurposes(form){
    var raw=form.getAttribute('data-dpdp-purposes')||'';
    var out=[];
    raw.split(',').forEach(function(part){
      part=part.trim(); if(!part)return;
      var i=part.indexOf(':');
      var id=(i>-1?part.slice(0,i):part).trim();
      var label=(i>-1?part.slice(i+1):part).trim();
      if(id)out.push({id:id,label:label});
    });
    // Sensible default if the brand declared none.
    if(!out.length)out.push({id:'marketing',label:'Send me offers and updates'});
    return out;
  }

  function findIdentity(form){
    var el=form.querySelector('[data-dpdp-identity]');
    if(!el)el=form.querySelector('input[type=email]')||form.querySelector('input[type=tel]');
    if(!el)return null;
    var type=(el.getAttribute('type')==='tel'||el.getAttribute('data-dpdp-identity')==='phone')?'phone':'email';
    return {el:el,type:type};
  }

  function buildConsent(form,purposes){
    var box=document.createElement('div');
    box.setAttribute('data-dpdp-consent','1');
    box.style.cssText='margin:12px 0;padding:13px 14px;border:0.5px solid #e3e3e8;border-radius:14px;background:#fff;font-family:inherit;font-size:13px;color:#16161d';
    var h='';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="width:22px;height:22px;border-radius:7px;background:'+P+'18;display:inline-flex;align-items:center;justify-content:center;font-size:12px">🛡️</span><span style="font-weight:600;font-size:13px;color:#16161d">Your privacy choice</span></div>';
    h+='<p style="font-size:12px;color:#8a8a93;line-height:1.5;margin:0 0 10px">'+BRAND+' is the Data Fiduciary for the details you share here, under India\\'s DPDP Act 2023. Pick what you\\'re happy for us to use them for — you can change your mind anytime.</p>';
    purposes.forEach(function(p){
      h+='<label style="display:flex;align-items:flex-start;gap:9px;padding:7px 0;cursor:pointer;font-size:13px;color:#16161d">'
        +'<input type="checkbox" data-dpdp-purpose="'+p.id+'" style="width:18px;height:18px;margin-top:1px;accent-color:'+P+';flex-shrink:0">'
        +'<span>'+p.label+'</span></label>';
    });
    h+='<div style="font-size:10.5px;color:#b6b6bd;margin-top:8px;line-height:1.5">Nothing is pre-ticked. For privacy queries'+(GRIEV?' contact <a href="mailto:'+GRIEV+'" style="color:'+P+'">'+GRIEV+'</a> or':'')+' lodge a grievance with the Data Protection Board of India.</div>';
    box.innerHTML=h;
    return box;
  }

  function record(form,purposes,identity,cb){
    var prefs={};
    var boxes=form.querySelectorAll('[data-dpdp-consent] input[data-dpdp-purpose]');
    for(var i=0;i<boxes.length;i++){prefs[boxes[i].getAttribute('data-dpdp-purpose')]=!!boxes[i].checked;}
    var val=identity?identity.el.value:'';
    if(PREVIEW||!val){if(cb)cb();return;}
    try{
      fetch(API+'/api/consent/record',{
        method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
        body:JSON.stringify({client_key:KEY,identifier:val,identifier_type:identity.type,purposes:prefs,page_url:location.href})
      });
    }catch(e){}
    if(cb)cb();
  }

  function attach(form){
    if(form.getAttribute('data-dpdp-bound'))return;
    form.setAttribute('data-dpdp-bound','1');
    var purposes=parsePurposes(form);
    var identity=findIdentity(form);
    // Inject the consent block just before the submit control (or at the form end).
    var box=buildConsent(form,purposes);
    var submit=form.querySelector('[type=submit],button:not([type=button])');
    if(submit&&submit.parentNode===form)form.insertBefore(box,submit);else form.appendChild(box);
    // Capture consent on submit, then let the form proceed.
    form.addEventListener('submit',function(){
      record(form,purposes,identity);
      // keepalive fetch lets the navigation/submit continue without blocking.
    },true);
  }

  function scan(){var forms=document.querySelectorAll('form[data-dpdp-form]');for(var i=0;i<forms.length;i++)attach(forms[i]);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  // Re-scan for forms added later (SPA / async).
  try{new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}
  window.DPDPForms={scan:scan};
})();`
}
