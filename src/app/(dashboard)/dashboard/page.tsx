import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/agents/AgentCard'
import { Plus, Bot } from 'lucide-react'
import type { Agent } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hola, {name} 👋</h1>
          <p className="text-muted-foreground">Gestiona y entrena tus agentes de IA</p>
        </div>
        <Button asChild>
          <Link href="/agents/new" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Agente
          </Link>
        </Button>
      </div>

      {!agents || agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aún no tienes agentes</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Crea tu primer agente de IA y entrénalo con tu conocimiento profesional.
          </p>
          <Button asChild>
            <Link href="/agents/new" className="gap-2">
              <Plus className="w-4 h-4" />
              Crear mi primer agente
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents as Agent[]).map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
