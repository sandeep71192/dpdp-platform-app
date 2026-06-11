import { redirect } from 'next/navigation'
import PortalShell from '@/components/portal/PortalShell'
import { getSessionContext, canAccessClient, clientIdForKey } from '@/lib/auth'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientKey: string }>
}) {
  const { clientKey } = await params

  // Only the brand that owns this portal (or a super-admin) may view it.
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  const clientId = await clientIdForKey(clientKey)
  if (!canAccessClient(ctx, clientId)) redirect('/login')

  return <PortalShell clientKey={clientKey}>{children}</PortalShell>
}
