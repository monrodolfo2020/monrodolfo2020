"use client"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, User, Menu } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface TopBarProps {
  user: SupabaseUser
  onMenuClick?: () => void
}

export function TopBar({ user, onMenuClick }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario'

  return (
    <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 -ml-1"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium hidden sm:block">{name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-slate-500 px-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  )
}
