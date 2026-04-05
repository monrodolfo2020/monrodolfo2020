import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat/ChatInterface'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Share2 } from 'lucide-react'

export default async function TestPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const supabase = await createClient()
  const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single()
  if (!agent) notFound()

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <h1 className="font-bold">Probar: {agent.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={`/agents/${agentId}/knowledge`}><BookOpen className="w-3.5 h-3.5" />Entrenar</Link>
          </Button>
          <Button size="sm" asChild className="gap-1">
            <Link href={`/agents/${agentId}/publish`}><Share2 className="w-3.5 h-3.5" />Publicar</Link>
          </Button>
        </div>
      </div>
      <div className="flex-1 border rounded-xl overflow-hidden bg-white">
        <ChatInterface agent={agent} isTest={true} />
      </div>
    </div>
  )
}
