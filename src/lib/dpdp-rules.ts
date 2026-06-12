export type DPDPCategory =
  | "fashion"
  | "skincare_beauty"
  | "food_beverage"
  | "electronics"
  | "kids_toys"
  | "health_wellness"
  | "finance"
  | "general_ecommerce"
  | "travel"
  | "home_furniture"
  | "lifestyle_gifting"
  | "pets"
  | "sports_fitness";

export interface DPDPRule {
  dataType: string;
  purpose: string;
  legalBasis: string;
  retention: string;
  thirdPartySharing: boolean;
  sensitiveData: boolean;
  childApplicable: boolean;
}

export interface JourneyStage {
  stage: string;
  icon: string;
  dataCollected: { field: string; why: string; necessary: boolean }[];
}

export interface ConsentPurposeGroup {
  id: string;
  label: string;
  description: string;
  necessary: boolean;
  dataPoints: string[];
}

export interface CategoryRules {
  category: DPDPCategory;
  displayName: string;
  description: string;
  rules: DPDPRule[];
  consentPurposes: string[];
  purposeGroups: ConsentPurposeGroup[];
  journeyStages: JourneyStage[];
  specialRequirements: string[];
}

const RULES: Record<DPDPCategory, CategoryRules> = {
  fashion: {
    category: "fashion",
    displayName: "Fashion & Apparel",
    description: "Online fashion and clothing retail",
    rules: [
      { dataType: "Name, Email, Phone number", purpose: "Order processing and delivery", legalBasis: "Consent + Legitimate Interest", retention: "7 years (GST compliance)", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Body measurements, size preferences", purpose: "Personalized recommendations", legalBasis: "Explicit Consent", retention: "Until consent withdrawn", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
      { dataType: "Purchase history, browsing data", purpose: "Targeted marketing and offers", legalBasis: "Consent", retention: "3 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Shipping address", purpose: "Delivery and returns", legalBasis: "Contract performance", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing and delivering your orders",
      "Sending order updates and delivery notifications",
      "Personalized product recommendations based on your size and preferences",
      "Promotional offers and marketing communications",
      "Sharing data with delivery partners for shipping",
    ],
    purposeGroups: [
      {
        id: "essential",
        label: "Needed to run your order",
        description: "The basics we can't skip — taking your order, processing payment, shipping it, and sorting out returns. This stays on because your order simply can't happen without it.",
        necessary: true,
        dataPoints: ["Name & contact details", "Shipping address", "Payment confirmation", "Order ID & history"],
      },
      {
        id: "functional",
        label: "Remember my preferences",
        description: "Lets the site remember your size, wishlist, and recently viewed items so you don't start from scratch each visit. Off until you turn it on.",
        necessary: false,
        dataPoints: ["Size & fit preferences", "Saved addresses", "Wishlist & saved items", "Recently viewed products"],
      },
      {
        id: "analytics",
        label: "Help improve the site",
        description: "Shows us, in aggregate, how people use the site so we can fix what's confusing and make it faster. Off until you turn it on.",
        necessary: false,
        dataPoints: ["Pages visited & time spent", "Product clicks & scroll depth", "Search queries", "Device & browser type"],
      },
      {
        id: "marketing",
        label: "Personalised offers & ads",
        description: "Lets us send you offers and style picks we think you'll like, and show you our ads on other sites. Off until you turn it on — your shopping works fine without it.",
        necessary: false,
        dataPoints: ["Purchase history", "Brand & style preferences", "Email open & click behaviour", "Ad interaction data"],
      },
    ],
    journeyStages: [
      {
        stage: "Browsing",
        icon: "👀",
        dataCollected: [
          { field: "Device type & browser", why: "To render the site correctly", necessary: true },
          { field: "Pages visited & time spent", why: "To improve site performance", necessary: false },
          { field: "Search queries", why: "To show relevant products", necessary: false },
          { field: "IP address (anonymised)", why: "Security & fraud prevention", necessary: true },
        ],
      },
      {
        stage: "Account Creation",
        icon: "👤",
        dataCollected: [
          { field: "Name, email, phone", why: "Account identification & login", necessary: true },
          { field: "Date of birth (optional)", why: "Age-appropriate offers", necessary: false },
          { field: "Gender (optional)", why: "Personalised product curation", necessary: false },
        ],
      },
      {
        stage: "Adding to Cart",
        icon: "🛒",
        dataCollected: [
          { field: "Product selections & sizes", why: "To save your cart", necessary: true },
          { field: "Wishlist items", why: "To save for later", necessary: false },
          { field: "Abandoned cart data", why: "To send reminder notifications", necessary: false },
        ],
      },
      {
        stage: "Checkout",
        icon: "💳",
        dataCollected: [
          { field: "Delivery address", why: "To ship your order", necessary: true },
          { field: "Payment method (tokenised)", why: "To process payment securely", necessary: true },
          { field: "GST number (optional)", why: "For GST invoice generation", necessary: false },
        ],
      },
      {
        stage: "Post-Purchase",
        icon: "📦",
        dataCollected: [
          { field: "Order & tracking ID", why: "Delivery status updates", necessary: true },
          { field: "Return & refund requests", why: "To process returns", necessary: true },
          { field: "Product reviews & ratings", why: "To improve product quality", necessary: false },
        ],
      },
      {
        stage: "Marketing",
        icon: "📣",
        dataCollected: [
          { field: "Email & notification preferences", why: "To send offers you opt into", necessary: false },
          { field: "Purchase history for targeting", why: "Personalised recommendations", necessary: false },
          { field: "Ad interaction data", why: "To measure campaign effectiveness", necessary: false },
        ],
      },
    ],
    specialRequirements: [
      "Clear opt-out for marketing",
      "Separate consent for size data if stored",
    ],
  },

  skincare_beauty: {
    category: "skincare_beauty",
    displayName: "Skincare & Beauty",
    description: "Skincare, cosmetics and personal care products",
    rules: [
      { dataType: "Name, Email, Contact details", purpose: "Order fulfillment", legalBasis: "Consent + Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Skin type, skin concerns, allergies", purpose: "Product recommendations", legalBasis: "Explicit Consent", retention: "Until consent withdrawn", thirdPartySharing: false, sensitiveData: true, childApplicable: false },
      { dataType: "Health-related data (skin conditions)", purpose: "Customized skincare advice", legalBasis: "Explicit Consent (Special Category)", retention: "Until consent withdrawn", thirdPartySharing: false, sensitiveData: true, childApplicable: false },
      { dataType: "Purchase history", purpose: "Repurchase reminders and offers", legalBasis: "Consent", retention: "3 years", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing your purchases and managing returns",
      "Collecting skin type and concern data to recommend suitable products",
      "Storing allergy and sensitivity information for your safety",
      "Sending personalized skincare tips and product recommendations",
      "Marketing communications about new launches and offers",
    ],
    purposeGroups: [
      {
        id: "essential",
        label: "Needed to run your order",
        description: "The basics we can't skip — placing your order, taking payment, and handling returns. This stays on because your order can't be completed without it.",
        necessary: true,
        dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history"],
      },
      {
        id: "skin_profile",
        label: "My skin details",
        description: "Things like your skin type, concerns, and any allergies. This is personal, so we keep it private, use it only to suggest products that suit you and keep you safe, and never sell it. Off until you choose to share it.",
        necessary: false,
        dataPoints: ["Skin type (oily, dry, combination)", "Skin concerns (acne, pigmentation, etc.)", "Known allergies & sensitivities", "Skin tone & undertone"],
      },
      {
        id: "analytics",
        label: "Help improve the site",
        description: "Shows us, in aggregate, how people use the site so we can make products easier to find. Off until you turn it on.",
        necessary: false,
        dataPoints: ["Products browsed & time spent", "Search terms used", "Routine builder interactions", "Device & location (city-level)"],
      },
      {
        id: "marketing",
        label: "Personalised offers & tips",
        description: "Lets us send you offers, restock alerts, and skincare tips matched to you. Off until you turn it on — your shopping works fine without it.",
        necessary: false,
        dataPoints: ["Purchase history", "Skin profile for targeting", "Email/SMS engagement data", "Repurchase cycle tracking"],
      },
    ],
    journeyStages: [
      {
        stage: "Browsing",
        icon: "👀",
        dataCollected: [
          { field: "Device & browser info", why: "Site rendering & security", necessary: true },
          { field: "Products viewed & duration", why: "Improve product discovery", necessary: false },
          { field: "Ingredient filter usage", why: "Personalise search results", necessary: false },
        ],
      },
      {
        stage: "Skin Quiz / Routine Builder",
        icon: "✨",
        dataCollected: [
          { field: "Skin type & concerns", why: "Recommend suitable products", necessary: false },
          { field: "Allergy & sensitivity details", why: "Avoid harmful ingredients — for your safety", necessary: false },
          { field: "Current skincare routine", why: "Build a compatible regimen", necessary: false },
        ],
      },
      {
        stage: "Account Creation",
        icon: "👤",
        dataCollected: [
          { field: "Name, email, phone", why: "Account & order management", necessary: true },
          { field: "Skin profile (if saved)", why: "Persist your quiz results", necessary: false },
        ],
      },
      {
        stage: "Checkout",
        icon: "💳",
        dataCollected: [
          { field: "Delivery address", why: "To ship your order", necessary: true },
          { field: "Payment method (tokenised)", why: "Secure payment processing", necessary: true },
        ],
      },
      {
        stage: "Post-Purchase",
        icon: "📦",
        dataCollected: [
          { field: "Order & delivery tracking", why: "Keep you updated on delivery", necessary: true },
          { field: "Product reviews & skin feedback", why: "Improve product formulations", necessary: false },
          { field: "Repurchase cycle", why: "Send timely restock reminders", necessary: false },
        ],
      },
      {
        stage: "Marketing",
        icon: "📣",
        dataCollected: [
          { field: "Purchase & browsing history", why: "Personalised offers", necessary: false },
          { field: "Skin profile for ad targeting", why: "Relevant product recommendations only", necessary: false },
          { field: "Email & notification engagement", why: "Measure campaign reach", necessary: false },
        ],
      },
    ],
    specialRequirements: [
      "Explicit consent required for skin/health data (sensitive category under DPDP)",
      "Right to erasure must be prominently displayed",
      "No sharing of health-related data with third parties without explicit consent",
    ],
  },

  food_beverage: {
    category: "food_beverage",
    displayName: "Food & Beverage",
    description: "Online food ordering, grocery, and beverage delivery",
    rules: [
      { dataType: "Name, Address, Phone", purpose: "Delivery and order management", legalBasis: "Contract", retention: "3 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Dietary preferences, allergens", purpose: "Safe food recommendations", legalBasis: "Explicit Consent", retention: "Until withdrawn", thirdPartySharing: false, sensitiveData: true, childApplicable: false },
      { dataType: "Location data", purpose: "Delivery address and restaurant discovery", legalBasis: "Consent", retention: "Session + 90 days history", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Payment data", purpose: "Transaction processing", legalBasis: "Contract", retention: "7 years (RBI compliance)", thirdPartySharing: true, sensitiveData: true, childApplicable: false },
    ],
    consentPurposes: [
      "Processing your food orders and managing delivery",
      "Sharing your delivery address with delivery partners",
      "Storing dietary preferences and allergy information for your safety",
      "Real-time location access for delivery tracking",
      "Personalized menu recommendations and offers",
    ],
    purposeGroups: [
      {
        id: "essential",
        label: "Needed to run your order",
        description: "The basics we can't skip — taking your order, payment, and your live location while it's being delivered. This stays on because we can't get your food to you without it.",
        necessary: true,
        dataPoints: ["Name, phone & email", "Delivery address", "Order details & payment confirmation", "Real-time location during delivery"],
      },
      {
        id: "dietary",
        label: "My food restrictions",
        description: "Allergies and dietary choices (like veg, vegan, or Jain). This is personal, so we keep it private and use it only to keep your food safe. Off until you choose to share it.",
        necessary: false,
        dataPoints: ["Allergens (nuts, dairy, gluten, etc.)", "Dietary preferences (veg, vegan, Jain, etc.)", "Religious dietary restrictions", "Health-based restrictions (diabetic, low-sodium, etc.)"],
      },
      {
        id: "analytics",
        label: "Help improve the service",
        description: "Shows us, in aggregate, how people order so we can speed up delivery and show more relevant menus. Off until you turn it on.",
        necessary: false,
        dataPoints: ["Order frequency & timing", "Cuisine & item preferences", "Search & filter behaviour", "Delivery location history"],
      },
      {
        id: "marketing",
        label: "Personalised deals",
        description: "Lets us send you deals, restaurant picks, and reorder nudges matched to you. Off until you turn it on — ordering works fine without it.",
        necessary: false,
        dataPoints: ["Order history for targeting", "Push notification engagement", "Promotional offer responses", "Referral programme participation"],
      },
    ],
    journeyStages: [
      { stage: "Browsing / Discovery", icon: "🔍", dataCollected: [{ field: "Location (city/pincode)", why: "Show available restaurants & delivery slots", necessary: true }, { field: "Search & filter queries", why: "Improve menu discovery", necessary: false }, { field: "Cuisine preference signals", why: "Personalise homepage", necessary: false }] },
      { stage: "Dietary Profile Setup", icon: "🥗", dataCollected: [{ field: "Allergen information", why: "Prevent harmful ingredient exposure", necessary: false }, { field: "Dietary type (veg/vegan/Jain)", why: "Filter relevant menu items", necessary: false }, { field: "Health restrictions", why: "Safe meal recommendations", necessary: false }] },
      { stage: "Ordering", icon: "🛒", dataCollected: [{ field: "Items added to cart", why: "Process your order", necessary: true }, { field: "Special instructions", why: "Customise your meal", necessary: true }, { field: "Saved addresses", why: "Faster checkout", necessary: false }] },
      { stage: "Checkout & Payment", icon: "💳", dataCollected: [{ field: "Delivery address (precise)", why: "To dispatch your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure transaction — RBI compliant", necessary: true }, { field: "GST details (optional)", why: "For business invoicing", necessary: false }] },
      { stage: "Delivery Tracking", icon: "🚴", dataCollected: [{ field: "Real-time GPS location", why: "Live delivery tracking & ETA", necessary: true }, { field: "Delivery partner details shared", why: "Coordinate handoff", necessary: true }] },
      { stage: "Post-Order / Marketing", icon: "📣", dataCollected: [{ field: "Order history", why: "Personalised reorder recommendations", necessary: false }, { field: "Rating & review data", why: "Improve food quality & service", necessary: false }, { field: "Notification preferences", why: "Send deals you opt into", necessary: false }] },
    ],
    specialRequirements: [
      "Dietary/allergen data is sensitive — requires explicit consent",
      "Location data consent must be granular (real-time vs. history)",
      "PCI-DSS compliance for payment data handling",
    ],
  },

  electronics: {
    category: "electronics",
    displayName: "Electronics & Technology",
    description: "Electronics, gadgets, and tech product retail",
    rules: [
      { dataType: "Name, Contact, Address", purpose: "Order and warranty management", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Device information, serial numbers", purpose: "Warranty and service", legalBasis: "Contract", retention: "Warranty period + 2 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Browsing and search data", purpose: "Product recommendations", legalBasis: "Consent", retention: "1 year", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Managing your orders, shipping, and returns",
      "Warranty registration and service coordination",
      "Product recommendations based on browsing history",
      "Technical support and after-sales service",
      "Promotional communications about deals and new products",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, warranty records, and returns. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Shipping address", "Order ID & invoice", "Payment confirmation"] },
      { id: "warranty", label: "Warranty & service", description: "Your device's serial number and purchase details so we can register the warranty and set up authorised repairs if you ever need them. Off until you turn it on.", necessary: false, dataPoints: ["Serial number / IMEI", "Purchase date & invoice", "Authorised service centre routing", "Repair history"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people browse and compare products so we can make shopping easier. Off until you turn it on.", necessary: false, dataPoints: ["Products compared & viewed", "Spec filter usage", "Search terms", "Time spent on product pages"] },
      { id: "marketing", label: "Deals & upgrade alerts", description: "Lets us send you price-drop alerts, deals, and upgrade picks matched to you. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase & search history", "Price alert preferences", "Email & notification engagement", "Ad click data"] },
    ],
    journeyStages: [
      { stage: "Browsing & Comparison", icon: "🔍", dataCollected: [{ field: "Products viewed & compared", why: "Improve comparison tools", necessary: false }, { field: "Spec filter selections", why: "Better search results", necessary: false }, { field: "Device & browser info", why: "Site rendering & security", necessary: true }] },
      { stage: "Account & Wishlist", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account management", necessary: true }, { field: "Wishlist & saved products", why: "Save items for later", necessary: false }, { field: "Price alert preferences", why: "Notify when price drops", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Shipping address", why: "Deliver your order", necessary: true }, { field: "Payment details (tokenised)", why: "Process payment securely", necessary: true }, { field: "GST number (optional)", why: "Business invoicing", necessary: false }] },
      { stage: "Warranty Registration", icon: "🛡️", dataCollected: [{ field: "Serial number / IMEI", why: "Register warranty with manufacturer", necessary: false }, { field: "Purchase date & proof", why: "Validate warranty claims", necessary: false }] },
      { stage: "After-Sales & Support", icon: "🔧", dataCollected: [{ field: "Device diagnostics (if shared)", why: "Remote troubleshooting", necessary: false }, { field: "Service request history", why: "Track repair status", necessary: true }, { field: "Delivery & return tracking", why: "Manage returns & replacements", necessary: true }] },
      { stage: "Marketing", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Upgrade & accessory recommendations", necessary: false }, { field: "Notification engagement", why: "Measure deal campaign reach", necessary: false }] },
    ],
    specialRequirements: [
      "Device data sharing with authorized service centers",
      "Clear consent for behavioral tracking and profiling",
    ],
  },

  kids_toys: {
    category: "kids_toys",
    displayName: "Kids & Toys",
    description: "Children's products, toys, and educational materials",
    rules: [
      { dataType: "Parent/guardian name, contact", purpose: "Order and account management", legalBasis: "Consent of parent/guardian", retention: "7 years", thirdPartySharing: false, sensitiveData: false, childApplicable: true },
      { dataType: "Child's age (for age-appropriate products)", purpose: "Product safety and appropriateness", legalBasis: "Explicit Parental Consent", retention: "Account lifetime", thirdPartySharing: false, sensitiveData: true, childApplicable: true },
    ],
    consentPurposes: [
      "Processing orders and delivering products",
      "Verifying age-appropriateness of products for child safety",
      "Sending order updates to parent/guardian",
      "Parental consent is mandatory for any data relating to minors",
    ],
    // NOTE: No analytics/behavioural or marketing/targeted-ad toggles here.
    // DPDP s.9(3) prohibits tracking, behavioural monitoring, and targeted
    // advertising directed at children — this is banned outright, not something
    // a parent can switch on. Only order-essential and non-tracking convenience
    // purposes are offered.
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we need to take your order, get paid, ship it, and handle returns. A parent or guardian has to give the OK first. This stays on so your order can be completed.", necessary: true, dataPoints: ["Parent / guardian name & contact", "Where to deliver", "Payment confirmation", "Child's age range (only to show age-safe products)"] },
      { id: "functional", label: "Handy extras", description: "Little conveniences like saving a wishlist or gift list and remembering age-group preferences. We don't track the child or build a profile — this is just to make shopping easier. Off by default; turn it on if you'd like.", necessary: false, dataPoints: ["Wishlist & gift registry", "Age-group preferences", "Things you bought before"] },
    ],
    journeyStages: [
      { stage: "Browsing", icon: "👀", dataCollected: [{ field: "Device & browser info", why: "Site rendering", necessary: true }, { field: "Age range filter used", why: "Show age-appropriate products", necessary: false }, { field: "Category & product views", why: "Improve curation", necessary: false }] },
      { stage: "Account Creation (Parent)", icon: "👤", dataCollected: [{ field: "Parent/guardian name & email", why: "Account ownership & communications", necessary: true }, { field: "Child's age range", why: "Filter age-appropriate products & comply with safety standards", necessary: false }] },
      { stage: "Cart & Wishlist", icon: "🧸", dataCollected: [{ field: "Selected items & quantities", why: "Process your order", necessary: true }, { field: "Gift registry items", why: "Save wish list for gifting", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment — no card data stored", necessary: true }] },
      { stage: "Post-Purchase", icon: "📦", dataCollected: [{ field: "Order & delivery tracking", why: "Keep parent updated", necessary: true }, { field: "Product safety feedback", why: "Ensure toy safety standards", necessary: false }] },
      { stage: "Marketing (Parent Only)", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Age-appropriate new arrival alerts", necessary: false }, { field: "Email opt-in", why: "Seasonal offers with explicit consent", necessary: false }] },
    ],
    specialRequirements: [
      "CRITICAL: DPDP mandates verifiable parental consent for all children's data",
      "No behavioral tracking or profiling of minors",
      "No targeted advertising to children",
      "Data minimization — collect only what is strictly necessary",
    ],
  },

  health_wellness: {
    category: "health_wellness",
    displayName: "Health & Wellness",
    description: "Health supplements, fitness, and wellness products",
    rules: [
      { dataType: "Name, contact, address", purpose: "Order fulfillment", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Health goals, fitness data, medical conditions", purpose: "Personalized health recommendations", legalBasis: "Explicit Consent (Special Category)", retention: "Until withdrawn", thirdPartySharing: false, sensitiveData: true, childApplicable: false },
    ],
    consentPurposes: [
      "Processing orders for health and wellness products",
      "Collecting health and fitness data to personalize recommendations",
      "Sending health tips and product usage guidance",
      "This data is sensitive and will NOT be shared with third parties",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, and delivery. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history"] },
      { id: "health_profile", label: "My health details", description: "Things like your health goals, any conditions, and fitness data. This is sensitive, so we keep it private, use it only to tailor recommendations for you, and never share or sell it. Off until you choose to share it.", necessary: false, dataPoints: ["Health goals (weight loss, muscle gain, etc.)", "Medical conditions (if disclosed)", "Current medications (if disclosed)", "Fitness level & activity data"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people use the site so we can improve recommendations and content. Off until you turn it on.", necessary: false, dataPoints: ["Product pages visited", "Content engagement", "Search terms", "Device type"] },
      { id: "marketing", label: "Personalised tips & offers", description: "Lets us send you health tips, refill reminders, and offers matched to you. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase history", "Health goals for targeting", "Email & notification engagement", "Subscription cycle data"] },
    ],
    journeyStages: [
      { stage: "Browsing & Discovery", icon: "🔍", dataCollected: [{ field: "Device & browser info", why: "Security & rendering", necessary: true }, { field: "Category & product views", why: "Improve product discovery", necessary: false }, { field: "Blog & content engagement", why: "Relevant health content", necessary: false }] },
      { stage: "Health Quiz / Profile", icon: "🏥", dataCollected: [{ field: "Health goals & concerns", why: "Personalised product stack recommendations", necessary: false }, { field: "Medical conditions (optional)", why: "Avoid contraindicated supplements", necessary: false }, { field: "Current medications (optional)", why: "Check for supplement interactions", necessary: false }] },
      { stage: "Account & Subscription", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account & subscription management", necessary: true }, { field: "Health profile (if saved)", why: "Persist your personalisation", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Process payment securely", necessary: true }] },
      { stage: "Subscription Cycle", icon: "🔄", dataCollected: [{ field: "Repurchase schedule", why: "Auto-renew subscription orders", necessary: false }, { field: "Usage feedback", why: "Improve formulations", necessary: false }] },
      { stage: "Marketing", icon: "📣", dataCollected: [{ field: "Health goals for targeting", why: "Relevant product recommendations", necessary: false }, { field: "Email & push engagement", why: "Measure campaign effectiveness", necessary: false }] },
    ],
    specialRequirements: [
      "Health data = special category under DPDP — requires explicit, separate consent",
      "Must display Data Protection Officer contact",
      "Right to data portability must be offered",
    ],
  },

  finance: {
    category: "finance",
    displayName: "Finance & Insurance",
    description: "Financial products, insurance, and BFSI",
    rules: [
      { dataType: "PAN, Aadhaar (last 4 digits), financial data", purpose: "KYC and regulatory compliance", legalBasis: "Legal Obligation", retention: "10 years (RBI/SEBI)", thirdPartySharing: true, sensitiveData: true, childApplicable: false },
      { dataType: "Income, credit score, transaction history", purpose: "Credit assessment and product eligibility", legalBasis: "Consent + Legal Obligation", retention: "7 years", thirdPartySharing: true, sensitiveData: true, childApplicable: false },
    ],
    consentPurposes: [
      "Regulatory KYC and identity verification as required by RBI/SEBI",
      "Processing financial applications and transactions",
      "Credit assessment using financial data",
      "Sharing data with credit bureaus and regulatory bodies as required by law",
      "Fraud detection and prevention",
    ],
    purposeGroups: [
      { id: "essential", label: "Required by law (KYC)", description: "Identity and account details the law requires us to collect and keep to verify who you are, prevent fraud, and meet RBI/SEBI rules. This stays on because we're legally required to do it.", necessary: true, dataPoints: ["Name, DOB & address (KYC)", "PAN number", "Aadhaar (last 4 digits)", "Bank account / IFSC for disbursals"] },
      { id: "credit", label: "Check what I qualify for", description: "Lets us look at your income and credit record to see which products you're eligible for. This means a credit-bureau check, as the rules require. Off until you choose to share it.", necessary: false, dataPoints: ["Income & employment details", "Credit score (CIBIL/Experian pull)", "Existing loan & EMI obligations", "Bank statement analysis"] },
      { id: "analytics", label: "Help improve the service", description: "Shows us, in aggregate, where people get stuck so we can make the application smoother. Off until you turn it on.", necessary: false, dataPoints: ["Application journey drop-offs", "Feature usage patterns", "Device & session data"] },
      { id: "marketing", label: "Personalised offers", description: "Lets us suggest products that may suit your financial profile. Off until you turn it on — nothing about your application depends on it.", necessary: false, dataPoints: ["Financial product preferences", "Eligibility-based targeting", "Email & notification engagement"] },
    ],
    journeyStages: [
      { stage: "Discovery", icon: "🔍", dataCollected: [{ field: "Device & browser info", why: "Security & fraud detection", necessary: true }, { field: "Product interest signals", why: "Eligibility pre-screening", necessary: false }] },
      { stage: "Account / KYC", icon: "🪪", dataCollected: [{ field: "Name, DOB, address", why: "Identity verification (RBI KYC mandate)", necessary: true }, { field: "PAN number", why: "Tax compliance & deduplication", necessary: true }, { field: "Aadhaar (last 4 digits or e-KYC)", why: "Government-mandated KYC", necessary: true }] },
      { stage: "Application", icon: "📋", dataCollected: [{ field: "Income & employment details", why: "Assess repayment capacity", necessary: true }, { field: "Bank statements (3–6 months)", why: "Verify income & spending patterns", necessary: true }, { field: "Existing obligations", why: "Calculate DTI ratio", necessary: true }] },
      { stage: "Credit Assessment", icon: "📊", dataCollected: [{ field: "Credit bureau pull (CIBIL/Experian)", why: "Mandatory for loan eligibility", necessary: true }, { field: "Transaction history analysis", why: "Assess creditworthiness", necessary: true }] },
      { stage: "Disbursal / Policy Issuance", icon: "✅", dataCollected: [{ field: "Bank account & IFSC", why: "Transfer approved funds / premium collection", necessary: true }, { field: "Nominee details (insurance)", why: "Policy documentation", necessary: true }] },
      { stage: "Ongoing / Marketing", icon: "📣", dataCollected: [{ field: "Repayment behaviour", why: "Risk monitoring (regulatory)", necessary: true }, { field: "Product preference for cross-sell", why: "Relevant product offers — with consent", necessary: false }] },
    ],
    specialRequirements: [
      "Financial data is sensitive — highest protection required",
      "Must display Grievance Officer details prominently",
      "Data Localization: financial data must be stored in India",
      "Must comply with RBI Master Directions on data handling",
    ],
  },

  general_ecommerce: {
    category: "general_ecommerce",
    displayName: "General E-commerce",
    description: "General online retail and marketplace",
    rules: [
      { dataType: "Name, email, phone, address", purpose: "Account and order management", legalBasis: "Contract + Consent", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Browsing history, purchase patterns", purpose: "Personalization and marketing", legalBasis: "Consent", retention: "2 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Creating and managing your account",
      "Processing orders, payments, and returns",
      "Sending order confirmations and shipping updates",
      "Personalized product recommendations",
      "Marketing communications and promotional offers",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — your account, taking your order, payment, and delivery. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history & invoices"] },
      { id: "functional", label: "Remember my preferences", description: "Lets the site remember your saved addresses, wishlist, and language so you don't redo them each visit. Off until you turn it on.", necessary: false, dataPoints: ["Saved addresses", "Wishlist & saved carts", "Language & currency preferences", "Recently viewed items"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people shop so we can fix what's confusing and improve the site. Off until you turn it on.", necessary: false, dataPoints: ["Pages visited & time spent", "Search queries", "Category & product interactions", "Device type & location (city)"] },
      { id: "marketing", label: "Personalised offers & ads", description: "Lets us send you recommendations and offers, and show you our ads on other sites. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase & browsing history", "Price alert preferences", "Email & notification engagement", "Ad interaction data"] },
    ],
    journeyStages: [
      { stage: "Browsing", icon: "👀", dataCollected: [{ field: "Device & browser info", why: "Site rendering & security", necessary: true }, { field: "Products viewed & time spent", why: "Improve recommendations", necessary: false }, { field: "Search queries", why: "Better search results", necessary: false }] },
      { stage: "Account Creation", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account management & login", necessary: true }, { field: "Communication preferences", why: "Control what updates you receive", necessary: false }] },
      { stage: "Cart & Wishlist", icon: "🛒", dataCollected: [{ field: "Items added to cart", why: "Save & process your order", necessary: true }, { field: "Wishlist items", why: "Save for later", necessary: false }, { field: "Abandoned cart data", why: "Send reminder notifications", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment processing", necessary: true }, { field: "GST number (optional)", why: "Business invoice generation", necessary: false }] },
      { stage: "Post-Purchase", icon: "📦", dataCollected: [{ field: "Order & delivery tracking", why: "Keep you updated", necessary: true }, { field: "Return & refund data", why: "Process returns smoothly", necessary: true }, { field: "Reviews & ratings", why: "Improve product quality", necessary: false }] },
      { stage: "Marketing", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Personalised recommendations", necessary: false }, { field: "Ad interaction data", why: "Measure campaign effectiveness", necessary: false }, { field: "Email/push engagement", why: "Optimise communication frequency", necessary: false }] },
    ],
    specialRequirements: [
      "Granular consent for marketing vs. operational communications",
      "Easy opt-out mechanism must be provided",
    ],
  },

  travel: {
    category: "travel",
    displayName: "Travel & Hospitality",
    description: "Travel booking, hotels, and tourism",
    rules: [
      { dataType: "Passport/ID details, travel dates", purpose: "Booking and travel compliance", legalBasis: "Contract + Legal Obligation", retention: "5 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Location, travel history", purpose: "Personalized travel recommendations", legalBasis: "Consent", retention: "2 years", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing travel bookings and reservations",
      "Sharing booking details with airlines, hotels, and travel partners",
      "Sending travel alerts and itinerary updates",
      "Personalized travel recommendations based on your history",
      "Compliance with immigration and travel regulations",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your booking", description: "The basics we can't skip — confirming your booking, the traveller and ID details that airlines and immigration require, and payment. This stays on because your trip can't be booked without it.", necessary: true, dataPoints: ["Name & passport / ID details", "Travel dates & destinations", "Contact for travel alerts", "Payment confirmation"] },
      { id: "traveller_profile", label: "My travel preferences", description: "Things like seat, meal, accessibility needs, and loyalty numbers, so your trips are set up the way you like. Off until you turn it on.", necessary: false, dataPoints: ["Seat & cabin preferences", "Meal type preferences", "Accessibility requirements", "Frequent flyer / loyalty numbers"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people search and book so we can improve search and pricing. Off until you turn it on.", necessary: false, dataPoints: ["Search & filter behaviour", "Booking funnel drop-offs", "Device & session data"] },
      { id: "marketing", label: "Travel deals & alerts", description: "Lets us send you fare drops, deals, and destination picks matched to you. Off until you turn it on — booking works fine without it.", necessary: false, dataPoints: ["Travel history for targeting", "Price alert preferences", "Email & notification engagement"] },
    ],
    journeyStages: [
      { stage: "Search & Discovery", icon: "✈️", dataCollected: [{ field: "Origin, destination & dates", why: "Search relevant flights/hotels", necessary: true }, { field: "Traveller count & type", why: "Display accurate pricing", necessary: true }, { field: "Search history", why: "Personalise future searches", necessary: false }] },
      { stage: "Account & Profile", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Booking confirmation & alerts", necessary: true }, { field: "Passport details (for international travel)", why: "Immigration & airline compliance", necessary: true }, { field: "Seat & meal preferences", why: "Personalise travel experience", necessary: false }] },
      { stage: "Booking", icon: "📋", dataCollected: [{ field: "Traveller details (all passengers)", why: "Issue tickets & comply with regulations", necessary: true }, { field: "Payment details (tokenised)", why: "Process booking payment", necessary: true }] },
      { stage: "Pre-Travel Alerts", icon: "🔔", dataCollected: [{ field: "Email & phone for alerts", why: "Flight delays, gate changes, check-in reminders", necessary: true }, { field: "Location (optional)", why: "Local travel advisories", necessary: false }] },
      { stage: "Post-Travel", icon: "🌟", dataCollected: [{ field: "Travel completion data", why: "Issue tax receipts & loyalty points", necessary: true }, { field: "Review & feedback", why: "Improve service quality", necessary: false }] },
      { stage: "Marketing", icon: "📣", dataCollected: [{ field: "Travel history & destinations", why: "Personalised deal recommendations", necessary: false }, { field: "Price alert subscriptions", why: "Notify on fare drops", necessary: false }] },
    ],
    specialRequirements: [
      "Passport/ID data requires heightened security measures",
      "Third-party sharing with travel partners must be disclosed",
    ],
  },

  home_furniture: {
    category: "home_furniture",
    displayName: "Home & Furniture",
    description: "Home decor, furniture, and interior design",
    rules: [
      { dataType: "Name, address, contact", purpose: "Order and installation scheduling", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Home dimensions, design preferences", purpose: "Interior design recommendations", legalBasis: "Consent", retention: "Account lifetime", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing orders and scheduling delivery/installation",
      "Coordinating with delivery and installation partners",
      "Design recommendations based on your home dimensions and preferences",
      "After-sales service and warranty management",
      "Promotional offers and new collection updates",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, delivery, and setting up installation. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Precise delivery address", "Payment confirmation", "Order & warranty records"] },
      { id: "home_profile", label: "My room details", description: "Room sizes and style preferences so you can see how products would look and fit in your space. Off until you turn it on.", necessary: false, dataPoints: ["Room dimensions & layout", "Interior style preferences", "Colour palette preferences", "AR/room visualisation session data"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people browse and use the room planner so we can improve them. Off until you turn it on.", necessary: false, dataPoints: ["Products viewed & time on page", "Room planner usage", "Search & filter behaviour", "Device type"] },
      { id: "marketing", label: "New launches & offers", description: "Lets us send you new collections, style ideas, and offers matched to you. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase & browsing history", "Style preference signals", "Email & notification engagement"] },
    ],
    journeyStages: [
      { stage: "Browsing & Inspiration", icon: "🛋️", dataCollected: [{ field: "Device & browser info", why: "Site rendering", necessary: true }, { field: "Products & collections viewed", why: "Improve recommendations", necessary: false }, { field: "Room style quiz responses", why: "Personalised curation", necessary: false }] },
      { stage: "Room Planner / AR", icon: "📐", dataCollected: [{ field: "Room dimensions entered", why: "Check product fit", necessary: false }, { field: "AR session data", why: "Visualise product in your space", necessary: false }, { field: "Saved room designs", why: "Revisit your shortlist", necessary: false }] },
      { stage: "Account & Wishlist", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account management", necessary: true }, { field: "Wishlist & saved designs", why: "Save items for later", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Precise delivery address", why: "Schedule delivery & installation", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment", necessary: true }, { field: "Floor / flat details", why: "Coordinate installation crew", necessary: true }] },
      { stage: "Delivery & Installation", icon: "🔨", dataCollected: [{ field: "Address shared with installation partner", why: "Coordinate delivery & assembly", necessary: true }, { field: "Preferred appointment slot", why: "Schedule installation", necessary: true }] },
      { stage: "After-Sales & Marketing", icon: "📣", dataCollected: [{ field: "Warranty registration data", why: "Process warranty claims", necessary: true }, { field: "Purchase history", why: "Complementary product suggestions", necessary: false }, { field: "Email/SMS engagement", why: "New collection alerts — with consent", necessary: false }] },
    ],
    specialRequirements: [
      "Home address data must be secured against unauthorized access",
      "Installation partner data sharing must be disclosed",
    ],
  },
  lifestyle_gifting: {
    category: "lifestyle_gifting",
    displayName: "Lifestyle, Fragrance & Gifting",
    description: "Home fragrance, incense, candles, wellness gifting, sustainable lifestyle products — brands like Phool, Nykaa Nature, The Body Shop",
    rules: [
      { dataType: "Name, email, phone", purpose: "Order and delivery management", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Gifting preferences, occasion data", purpose: "Personalised gift recommendations", legalBasis: "Consent", retention: "2 years", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
      { dataType: "Purchase history", purpose: "Repurchase reminders and subscription", legalBasis: "Consent", retention: "3 years", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing and delivering your orders",
      "Sending order and delivery updates",
      "Personalised product and gift recommendations",
      "Subscription and repurchase reminders",
      "Promotional offers and new collection launches",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, and handling returns. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history"] },
      { id: "functional", label: "Remember my preferences", description: "Saves your wishlists, gift messages, and subscription settings so you don't redo them each visit. Off until you turn it on.", necessary: false, dataPoints: ["Wishlist & saved items", "Gift message history", "Subscription preferences", "Saved addresses"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people browse so we can make products easier to find. Off until you turn it on.", necessary: false, dataPoints: ["Products viewed & time spent", "Search queries", "Collection interactions", "Device type"] },
      { id: "marketing", label: "Offers & gifting reminders", description: "Lets us send you offers, new-launch alerts, and occasion-based gifting nudges matched to you. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase history", "Occasion & gifting preferences", "Email & notification engagement", "Repurchase cycle"] },
    ],
    journeyStages: [
      { stage: "Browsing & Discovery", icon: "🕯️", dataCollected: [{ field: "Device & browser info", why: "Site rendering & security", necessary: true }, { field: "Products & collections viewed", why: "Improve recommendations", necessary: false }, { field: "Search terms", why: "Better product discovery", necessary: false }] },
      { stage: "Account & Wishlist", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account & order management", necessary: true }, { field: "Wishlist items", why: "Save for later or gifting", necessary: false }, { field: "Gift occasion preferences", why: "Personalised recommendations", necessary: false }] },
      { stage: "Cart & Gifting", icon: "🎁", dataCollected: [{ field: "Items & quantities", why: "Process your order", necessary: true }, { field: "Gift message & wrapping", why: "Customise gift packaging", necessary: false }, { field: "Recipient details (if gifting)", why: "Ship directly to recipient", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment", necessary: true }] },
      { stage: "Post-Purchase", icon: "📦", dataCollected: [{ field: "Order & delivery tracking", why: "Keep you updated", necessary: true }, { field: "Product reviews & ratings", why: "Improve product quality", necessary: false }, { field: "Repurchase cycle", why: "Timely restock reminders", necessary: false }] },
      { stage: "Marketing", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Personalised new launch recommendations", necessary: false }, { field: "Occasion data", why: "Timely gifting reminders — with consent", necessary: false }, { field: "Email/notification engagement", why: "Measure campaign reach", necessary: false }] },
    ],
    specialRequirements: ["Easy opt-out for marketing", "Separate consent for gifting occasion data if stored"],
  },

  pets: {
    category: "pets",
    displayName: "Pets & Pet Care",
    description: "Pet food, accessories, grooming, and veterinary products",
    rules: [
      { dataType: "Name, email, phone", purpose: "Order management", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Pet type, breed, age, health conditions", purpose: "Safe product recommendations", legalBasis: "Explicit Consent", retention: "Until withdrawn", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing orders and managing deliveries",
      "Storing pet profile data for safe product recommendations",
      "Subscription and auto-replenishment management",
      "Veterinary product safety filtering",
      "Personalised offers and new product alerts",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, and delivery. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history"] },
      { id: "pet_profile", label: "My pet's details", description: "Your pet's type, breed, age, and any health notes, used only to suggest products that are safe for them. Off until you choose to share it.", necessary: false, dataPoints: ["Pet name & species", "Breed & age", "Weight & size", "Known health conditions or allergies"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people browse so we can improve our range and subscriptions. Off until you turn it on.", necessary: false, dataPoints: ["Products browsed", "Search queries", "Subscription patterns", "Device type"] },
      { id: "marketing", label: "Reminders & deals", description: "Lets us send you refill reminders, new-product alerts, and deals matched to you and your pet. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase history", "Pet profile for targeting", "Email & notification engagement", "Subscription cycle data"] },
    ],
    journeyStages: [
      { stage: "Browsing", icon: "🐾", dataCollected: [{ field: "Device & browser info", why: "Site rendering", necessary: true }, { field: "Pet category browsing", why: "Relevant product display", necessary: false }] },
      { stage: "Pet Profile Setup", icon: "🐶", dataCollected: [{ field: "Pet species & breed", why: "Filter appropriate products", necessary: false }, { field: "Pet age & weight", why: "Correct dosage & sizing", necessary: false }, { field: "Health conditions & allergies", why: "Avoid harmful products", necessary: false }] },
      { stage: "Account & Subscription", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account & subscription management", necessary: true }, { field: "Auto-replenishment schedule", why: "Regular supply without re-ordering", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment", necessary: true }] },
      { stage: "Post-Purchase & Marketing", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Replenishment reminders", necessary: false }, { field: "Product reviews", why: "Improve product safety & quality", necessary: false }] },
    ],
    specialRequirements: ["Pet health data requires explicit consent", "No sharing of pet health data with third parties"],
  },

  sports_fitness: {
    category: "sports_fitness",
    displayName: "Sports & Fitness",
    description: "Sports equipment, gym wear, supplements, and fitness gear",
    rules: [
      { dataType: "Name, email, phone", purpose: "Order and account management", legalBasis: "Contract", retention: "7 years", thirdPartySharing: true, sensitiveData: false, childApplicable: false },
      { dataType: "Fitness goals, body measurements, activity data", purpose: "Personalised product recommendations", legalBasis: "Consent", retention: "Until withdrawn", thirdPartySharing: false, sensitiveData: false, childApplicable: false },
    ],
    consentPurposes: [
      "Processing and delivering your orders",
      "Storing fitness profile data for personalised recommendations",
      "Sending training tips and product usage guidance",
      "Subscription and replenishment for consumables",
      "Promotional offers and new gear launches",
    ],
    purposeGroups: [
      { id: "essential", label: "Needed to run your order", description: "The basics we can't skip — taking your order, payment, and managing your account. This stays on because your order can't be completed without it.", necessary: true, dataPoints: ["Name, email & phone", "Delivery address", "Payment confirmation", "Order history"] },
      { id: "fitness_profile", label: "My fitness details", description: "Your goals and body measurements, used to get sizing right and suggest the right gear and supplements. Off until you choose to share it.", necessary: false, dataPoints: ["Height, weight & body type", "Fitness goals (strength, endurance, weight loss)", "Activity level", "Preferred sports/training type"] },
      { id: "analytics", label: "Help improve the site", description: "Shows us, in aggregate, how people browse so we can improve our range and content. Off until you turn it on.", necessary: false, dataPoints: ["Products browsed", "Search queries", "Category interactions", "Device type"] },
      { id: "marketing", label: "New gear & deals", description: "Lets us send you new launches, training tips, and deals matched to your sport. Off until you turn it on — your shopping works fine without it.", necessary: false, dataPoints: ["Purchase & activity history", "Fitness goals for targeting", "Email & notification engagement"] },
    ],
    journeyStages: [
      { stage: "Browsing", icon: "🏃", dataCollected: [{ field: "Device & browser info", why: "Site rendering & security", necessary: true }, { field: "Category & product views", why: "Improve recommendations", necessary: false }] },
      { stage: "Fitness Profile / Size Guide", icon: "💪", dataCollected: [{ field: "Height & weight", why: "Accurate size recommendations", necessary: false }, { field: "Fitness goals", why: "Relevant supplement & gear suggestions", necessary: false }, { field: "Sport / training type", why: "Category-specific curation", necessary: false }] },
      { stage: "Account & Subscription", icon: "👤", dataCollected: [{ field: "Name, email, phone", why: "Account & subscription management", necessary: true }, { field: "Auto-replenishment for supplements", why: "Regular supply without re-ordering", necessary: false }] },
      { stage: "Checkout", icon: "💳", dataCollected: [{ field: "Delivery address", why: "Ship your order", necessary: true }, { field: "Payment details (tokenised)", why: "Secure payment", necessary: true }] },
      { stage: "Post-Purchase & Marketing", icon: "📣", dataCollected: [{ field: "Purchase history", why: "Replenishment & upsell recommendations", necessary: false }, { field: "Product reviews", why: "Improve quality & sizing accuracy", necessary: false }] },
    ],
    specialRequirements: ["Body measurement data requires explicit consent", "Clear opt-out for marketing communications"],
  },
};

export function getRulesForCategory(category: DPDPCategory): CategoryRules {
  return RULES[category];
}

export function getAllCategories(): CategoryRules[] {
  return Object.values(RULES);
}
