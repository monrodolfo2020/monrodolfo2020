import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { KnowledgeUploader } from '@/components/knowledge/KnowledgeUploader'
import { KnowledgeList } from '@/components/knowledge/KnowledgeList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default async function KnowledgePage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const supabase = await createClient()

  const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single()
  if (!agent) notFound()

  const { data: items } = await supabase
    .from('knowledge_items').select('*').eq('agent_id', agentId).order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Entrenar: {agent.name}</h1>
            <p className="text-muted-foreground text-sm">Añade conocimiento para que tu agente pueda responder preguntas</p>
          </div>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/agents/${agentId}/test`}>
            <MessageSquare className="w-4 h-4" /> Probar agente
          </Link>
        </Button>
      </div>

      <KnowledgeUploader agentId={agentId} />
      <KnowledgeList initialItems={items || []} agentId={agentId} />
    </div>
  )
}
