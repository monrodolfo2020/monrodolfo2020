"use client"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function TopBar({ user }: { user: SupabaseUser }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-slate-500">
          <LogOut className="w-4 h-4" />
          Salir
        </Button>
      </div>
    </header>
  )
}
