'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@mall/types'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { label: 'Resumen', href: 'overview', icon: '▦' },
  { label: 'Mantenimiento', href: 'maintenance', icon: '🔧' },
  { label: 'Seguridad', href: 'security', icon: '🛡' },
  { label: 'Inventario', href: 'inventory', icon: '📦' },
  { label: 'Hallazgos', href: 'findings', icon: '🔍' },
  { label: 'Reportes', href: 'reports', icon: '📊' },
  { label: 'Configuración', href: 'settings', icon: '⚙' },
]

interface DashboardShellProps {
  children: React.ReactNode
  profile: UserProfile
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const mallId = params['mallId'] as string

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Mall Management</h1>
          <p className="text-xs text-gray-500 mt-1">{profile.full_name}</p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-brand-100 text-brand-700 rounded-full">
            {profile.role.replace(/_/g, ' ')}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const href = mallId ? `/${mallId}/${item.href}` : `/super-admin`
            const isActive = pathname.includes(`/${item.href}`)
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
