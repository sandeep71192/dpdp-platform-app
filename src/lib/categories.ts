// Lightweight category list for client-side UI (avoids bundling the full rules file).
export const DPDP_CATEGORIES: { id: string; label: string }[] = [
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'skincare_beauty', label: 'Skincare & Beauty' },
  { id: 'food_beverage', label: 'Food & Beverage' },
  { id: 'electronics', label: 'Electronics & Technology' },
  { id: 'kids_toys', label: 'Kids & Toys' },
  { id: 'health_wellness', label: 'Health & Wellness' },
  { id: 'finance', label: 'Finance & Insurance' },
  { id: 'general_ecommerce', label: 'General E-commerce' },
  { id: 'travel', label: 'Travel & Hospitality' },
  { id: 'home_furniture', label: 'Home & Furniture' },
  { id: 'lifestyle_gifting', label: 'Lifestyle, Fragrance & Gifting' },
  { id: 'pets', label: 'Pets & Pet Care' },
  { id: 'sports_fitness', label: 'Sports & Fitness' },
]

// Categories that involve children's data — require special handling under DPDP s.9.
export const CHILDREN_CATEGORIES = ['kids_toys']
