"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, LayoutDashboard, Plus, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Mis Agentes', icon: LayoutDashboard },
  { href: '/agents/new', label: 'Crear Agente', icon: Plus },
  { href: '/settings', label: 'Configuracion', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <div className="p-5 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">AgentForge</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
    </>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex w-64 bg-white border-r flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r flex flex-col z-40 transition-transform duration-300 md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}
