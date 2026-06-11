import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { getSessionContext } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'super_admin') {
    // Brand admins don't belong in the agency dashboard — send them to their portal.
    redirect('/login')
  }
  return (
    <div className="flex h-screen bg-[#f7f6f3] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
