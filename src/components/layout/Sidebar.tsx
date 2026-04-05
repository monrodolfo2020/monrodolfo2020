"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, LayoutDashboard, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Mis Agentes', icon: LayoutDashboard },
  { href: '/agents/new', label: 'Crear Agente', icon: Plus },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">AgentForge</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? "bg-black text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">AgentForge v1.0</p>
      </div>
    </aside>
  )
}
