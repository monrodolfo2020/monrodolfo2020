import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Bot } from 'lucide-react'
import type { Agent } from '@/types'

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createAdminClient()
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, description, avatar_url, tone, model_id, system_prompt, is_published, total_conversations, total_messages')
    .eq('share_token', token)
    .eq('is_published', true)
    .single()

  if (error || !agent) notFound()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-screen">
        <div className="flex-1 bg-white shadow-sm rounded-none md:rounded-xl md:my-4 overflow-hidden flex flex-col">
          <ChatInterface agent={agent as Agent} />
        </div>
      </div>
      <footer className="text-center py-3 text-xs text-slate-400">
        Creado con{' '}
        <a href="/" className="hover:text-slate-600 font-medium">AgentForge</a>
        {' '}— Crea tu propio agente de IA
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createAdminClient()
  const { data } = await supabase.from('agents').select('name, description').eq('share_token', token).single()
  if (!data) return { title: 'Agente no encontrado' }
  return {
    title: data.name,
    description: data.description || `Chatea con ${data.name}`,
  }
}
