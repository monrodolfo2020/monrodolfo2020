"use client"
import { useEffect, useRef, useState } from 'react'
import { useAgentChat } from '@/hooks/useAgentChat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, User, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Agent } from '@/types'

export function ChatInterface({ agent, isTest = false }: { agent: Agent; isTest?: boolean }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [visitorId] = useState(() => {
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem('agentforge_visitor')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('agentforge_visitor', id) }
    return id
  })

  const { messages, input, setInput, handleSubmit, isLoading } = useAgentChat({
    agentId: agent.id,
    visitorId,
    isTest,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">{agent.name}</h2>
          {agent.description && <p className="text-xs text-muted-foreground">{agent.description}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold mb-2">Hola, soy {agent.name}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {agent.description || 'Pregúntame cualquier cosa sobre mi área de experiencia.'}
            </p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.role === 'user' ? 'bg-black' : 'bg-slate-200'
            }`}>
              {m.role === 'user'
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-slate-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              m.role === 'user'
                ? 'bg-black text-white rounded-tr-sm'
                : 'bg-slate-100 text-slate-900 rounded-tl-sm'
            }`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Escribe tu pregunta para ${agent.name}...`}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent) }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="flex-shrink-0 h-11 w-11">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
