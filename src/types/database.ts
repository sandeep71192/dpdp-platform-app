export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Plan = 'free' | 'starter' | 'growth' | 'enterprise'
export type EventType = 'shown' | 'accepted_all' | 'rejected_all' | 'customised' | 'withdrawn'
export type Platform = 'shopify' | 'woocommerce' | 'webflow' | 'wix' | 'custom' | 'framer'
export type IntegrationStatus = 'pending' | 'connected' | 'error' | 'disconnected'
export type UserRole = 'super_admin' | 'client_admin'

export interface Client {
  id: string
  created_at: string
  updated_at: string
  name: string
  domain: string
  logo_url: string | null
  tagline: string | null
  owner_name: string | null
  owner_email: string
  phone: string | null
  plan: Plan
  plan_expires_at: string | null
  client_key: string
  is_active: boolean
  onboarded_at: string | null
}

export interface WidgetConfig {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  primary_color: string
  secondary_color: string
  text_color: string
  category: string
  confidence: number
  default_lang: string
  position: 'bottom-right' | 'bottom-left' | 'bottom-center'
  show_language_switcher: boolean
  purpose_groups: Json
  translations: Json
  is_published: boolean
  published_at: string | null
  version: number
}

export interface ConsentEvent {
  id: string
  created_at: string
  client_id: string
  event_type: EventType
  consented_to: Json
  language_used: string | null
  device_type: string | null
  country: string
  page_url: string | null
  session_id: string | null
}

export interface ConsentAnalyticsDaily {
  id: string
  client_id: string
  date: string
  total_shown: number
  total_accepted_all: number
  total_rejected_all: number
  total_customised: number
  total_withdrawn: number
  analytics_accepted: number
  marketing_accepted: number
  functional_accepted: number
  lang_breakdown: Json
  device_breakdown: Json
}

export interface PlatformUser {
  id: string
  created_at: string
  email: string
  name: string | null
  role: UserRole
  client_id: string | null
  auth_user_id: string | null
}

export interface Integration {
  id: string
  created_at: string
  client_id: string
  platform: Platform
  status: IntegrationStatus
  shopify_domain: string | null
  shopify_script_tag_id: string | null
  config: Json
  last_synced_at: string | null
  error_message: string | null
}

export interface Database {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> }
      widget_configs: { Row: WidgetConfig; Insert: Partial<WidgetConfig>; Update: Partial<WidgetConfig> }
      consent_events: { Row: ConsentEvent; Insert: Partial<ConsentEvent>; Update: Partial<ConsentEvent> }
      consent_analytics_daily: { Row: ConsentAnalyticsDaily; Insert: Partial<ConsentAnalyticsDaily>; Update: Partial<ConsentAnalyticsDaily> }
      platform_users: { Row: PlatformUser; Insert: Partial<PlatformUser>; Update: Partial<PlatformUser> }
      integrations: { Row: Integration; Insert: Partial<Integration>; Update: Partial<Integration> }
    }
  }
}
