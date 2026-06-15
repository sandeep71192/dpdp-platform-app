// Static, pre-translated consent-widget copy in all 11 languages.
//
// The widget's copy is a small set of FIXED UI strings plus one templated sentence —
// it does not need an LLM. Shipping it statically is free, instant, deterministic, and
// removes the mistranslation-liability risk of AI-generated legal notices. These strings
// should still get a native-speaker review pass before relying on them in production.

export interface WidgetCopy {
  title: string
  body: string // contains {brand}, substituted at build time
  allowAll: string
  onlyNecessary: string
  customise: string
  poweredBy: string
}

const COPY: Record<string, WidgetCopy> = {
  en: { title: 'We value your privacy', body: "{brand} uses your data to improve your experience, in line with India's DPDP Act 2023.", allowAll: 'Accept All', onlyNecessary: 'Only Necessary', customise: 'Customise', poweredBy: 'Protected under DPDP Act 2023' },
  hi: { title: 'हम आपकी निजता का सम्मान करते हैं', body: '{brand} भारत के DPDP अधिनियम 2023 के अनुरूप आपके अनुभव को बेहतर बनाने के लिए आपके डेटा का उपयोग करता है।', allowAll: 'सभी स्वीकारें', onlyNecessary: 'केवल आवश्यक', customise: 'अनुकूलित करें', poweredBy: 'DPDP अधिनियम 2023 के तहत सुरक्षित' },
  bn: { title: 'আমরা আপনার গোপনীয়তাকে সম্মান করি', body: '{brand} ভারতের DPDP আইন ২০২৩ অনুসারে আপনার অভিজ্ঞতা উন্নত করতে আপনার ডেটা ব্যবহার করে।', allowAll: 'সব গ্রহণ করুন', onlyNecessary: 'শুধু প্রয়োজনীয়', customise: 'কাস্টমাইজ করুন', poweredBy: 'DPDP আইন ২০২৩ দ্বারা সুরক্ষিত' },
  te: { title: 'మేము మీ గోప్యతను గౌరవిస్తాము', body: '{brand} భారత DPDP చట్టం 2023కి అనుగుణంగా మీ అనుభవాన్ని మెరుగుపరచడానికి మీ డేటాను ఉపయోగిస్తుంది.', allowAll: 'అన్నీ అంగీకరించండి', onlyNecessary: 'అవసరమైనవి మాత్రమే', customise: 'అనుకూలీకరించండి', poweredBy: 'DPDP చట్టం 2023 ద్వారా రక్షించబడింది' },
  mr: { title: 'आम्ही तुमच्या गोपनीयतेचा आदर करतो', body: '{brand} भारताच्या DPDP कायदा 2023 नुसार तुमचा अनुभव सुधारण्यासाठी तुमचा डेटा वापरते.', allowAll: 'सर्व स्वीकारा', onlyNecessary: 'फक्त आवश्यक', customise: 'सानुकूल करा', poweredBy: 'DPDP कायदा 2023 अंतर्गत संरक्षित' },
  ta: { title: 'உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்', body: '{brand} இந்தியாவின் DPDP சட்டம் 2023 இற்கு இணங்க உங்கள் அனுபவத்தை மேம்படுத்த உங்கள் தரவைப் பயன்படுத்துகிறது.', allowAll: 'அனைத்தையும் ஏற்க', onlyNecessary: 'தேவையானவை மட்டும்', customise: 'தனிப்பயனாக்கு', poweredBy: 'DPDP சட்டம் 2023 இன் கீழ் பாதுகாக்கப்படுகிறது' },
  gu: { title: 'અમે તમારી ગોપનીયતાનું સન્માન કરીએ છીએ', body: '{brand} ભારતના DPDP કાયદો 2023 અનુસાર તમારો અનુભવ સુધારવા માટે તમારા ડેટાનો ઉપયોગ કરે છે.', allowAll: 'બધું સ્વીકારો', onlyNecessary: 'ફક્ત જરૂરી', customise: 'કસ્ટમાઇઝ કરો', poweredBy: 'DPDP કાયદો 2023 હેઠળ સુરક્ષિત' },
  kn: { title: 'ನಾವು ನಿಮ್ಮ ಗೌಪ್ಯತೆಯನ್ನು ಗೌರವಿಸುತ್ತೇವೆ', body: '{brand} ಭಾರತದ DPDP ಕಾಯಿದೆ 2023 ಕ್ಕೆ ಅನುಗುಣವಾಗಿ ನಿಮ್ಮ ಅನುಭವವನ್ನು ಸುಧಾರಿಸಲು ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಬಳಸುತ್ತದೆ.', allowAll: 'ಎಲ್ಲವನ್ನೂ ಸ್ವೀಕರಿಸಿ', onlyNecessary: 'ಅಗತ್ಯವಿರುವುದು ಮಾತ್ರ', customise: 'ಕಸ್ಟಮೈಸ್ ಮಾಡಿ', poweredBy: 'DPDP ಕಾಯಿದೆ 2023 ರ ಅಡಿಯಲ್ಲಿ ಸಂರಕ್ಷಿತ' },
  ml: { title: 'ഞങ്ങൾ നിങ്ങളുടെ സ്വകാര്യതയെ ബഹുമാനിക്കുന്നു', body: '{brand} ഇന്ത്യയുടെ DPDP നിയമം 2023 അനുസരിച്ച് നിങ്ങളുടെ അനുഭവം മെച്ചപ്പെടുത്താൻ നിങ്ങളുടെ ഡാറ്റ ഉപയോഗിക്കുന്നു.', allowAll: 'എല്ലാം സ്വീകരിക്കുക', onlyNecessary: 'ആവശ്യമുള്ളവ മാത്രം', customise: 'ഇഷ്ടാനുസൃതമാക്കുക', poweredBy: 'DPDP നിയമം 2023 പ്രകാരം സംരക്ഷിതം' },
  pa: { title: 'ਅਸੀਂ ਤੁਹਾਡੀ ਨਿੱਜਤਾ ਦਾ ਸਤਿਕਾਰ ਕਰਦੇ ਹਾਂ', body: '{brand} ਭਾਰਤ ਦੇ DPDP ਐਕਟ 2023 ਅਨੁਸਾਰ ਤੁਹਾਡੇ ਅਨੁਭਵ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਲਈ ਤੁਹਾਡੇ ਡਾਟੇ ਦੀ ਵਰਤੋਂ ਕਰਦਾ ਹੈ।', allowAll: 'ਸਭ ਸਵੀਕਾਰ ਕਰੋ', onlyNecessary: 'ਸਿਰਫ਼ ਲੋੜੀਂਦੇ', customise: 'ਕਸਟਮਾਈਜ਼ ਕਰੋ', poweredBy: 'DPDP ਐਕਟ 2023 ਅਧੀਨ ਸੁਰੱਖਿਅਤ' },
  or: { title: 'ଆମେ ଆପଣଙ୍କ ଗୋପନୀୟତାକୁ ସମ୍ମାନ କରୁ', body: '{brand} ଭାରତର DPDP ଆଇନ 2023 ଅନୁଯାୟୀ ଆପଣଙ୍କ ଅନୁଭବ ଉନ୍ନତ କରିବାକୁ ଆପଣଙ୍କ ତଥ୍ୟ ବ୍ୟବହାର କରେ।', allowAll: 'ସବୁ ଗ୍ରହଣ କରନ୍ତୁ', onlyNecessary: 'କେବଳ ଆବଶ୍ୟକ', customise: 'କଷ୍ଟମାଇଜ୍ କରନ୍ତୁ', poweredBy: 'DPDP ଆଇନ 2023 ଅଧୀନରେ ସୁରକ୍ଷିତ' },
}

export interface Translations { [lang: string]: WidgetCopy }

// Build the per-brand translations object by substituting the brand name into each
// language's templated body. No API call, no per-brand variation beyond the name.
export function buildStaticTranslations(brandName: string): Translations {
  const safe = (brandName || 'This store').trim()
  const out: Translations = {}
  for (const [lang, c] of Object.entries(COPY)) {
    out[lang] = { ...c, body: c.body.replace('{brand}', safe) }
  }
  return out
}
