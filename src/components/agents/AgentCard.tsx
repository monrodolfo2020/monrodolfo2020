"use client"
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, MessageSquare, BookOpen, Share2, Settings } from 'lucide-react'
import type { Agent } from '@/types'

const TONE_LABELS: Record<string, string> = {
  professional: 'Profesional',
  friendly: 'Amigable',
  formal: 'Formal',
  casual: 'Casual',
  enthusiastic: 'Entusiasta',
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
            {agent.avatar_url
              ? <img src={agent.avatar_url} alt={agent.name} className="w-12 h-12 rounded-xl object-cover" />
              : <Bot className="w-6 h-6 text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{agent.name}</h3>
              {agent.is_published
                ? <Badge variant="success" className="text-xs">Publicado</Badge>
                : <Badge variant="secondary" className="text-xs">Borrador</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {agent.description || TONE_LABELS[agent.tone] || 'Sin descripción'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-lg font-bold">{agent.total_knowledge_items}</div>
            <div className="text-xs text-muted-foreground">Documentos</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-lg font-bold">{agent.total_conversations}</div>
            <div className="text-xs text-muted-foreground">Chats</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="text-lg font-bold">{agent.total_messages}</div>
            <div className="text-xs text-muted-foreground">Mensajes</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
          <Link href={`/agents/${agent.id}/knowledge`}>
            <BookOpen className="w-3.5 h-3.5" />
            Entrenar
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
          <Link href={`/agents/${agent.id}/test`}>
            <MessageSquare className="w-3.5 h-3.5" />
            Probar
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="w-9 h-9">
          <Link href={`/agents/${agent.id}/publish`}>
            <Share2 className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
