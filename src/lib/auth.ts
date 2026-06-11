import { createServerSupabase, supabaseAdmin } from './supabase'

export interface SessionContext {
  userId: string
  email: string | null
  role: 'super_admin' | 'client_admin'
  clientId: string | null
}

// Resolve the authenticated user and their platform_users row (role + client scope).
// Returns null if not authenticated.
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pu } = await supabaseAdmin
    .from('platform_users')
    .select('role, client_id')
    .eq('auth_user_id', user.id)
    .single()

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (pu?.role as SessionContext['role']) || 'client_admin',
    clientId: pu?.client_id ?? null,
  }
}

// True if the session may access data for the given client_id.
export function canAccessClient(ctx: SessionContext | null, clientId: string | null): boolean {
  if (!ctx || !clientId) return false
  if (ctx.role === 'super_admin') return true
  return ctx.clientId === clientId
}

// Resolve a client_id from a client_key, for ownership checks on key-based routes.
export async function clientIdForKey(clientKey: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('clients').select('id').eq('client_key', clientKey).single()
  return data?.id ?? null
}
