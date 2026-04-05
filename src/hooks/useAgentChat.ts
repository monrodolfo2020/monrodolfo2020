"use client"
import { useState, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UseAgentChatOptions {
  agentId: string
  visitorId?: string
  isTest?: boolean
}

export function useAgentChat({ agentId, visitorId, isTest }: UseAgentChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          visitorId,
          isTest,
          conversationId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Error al conectar con el agente')

      const convId = res.headers.get('X-Conversation-Id')
      if (convId) setConversationId(convId)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ))
      }
    } catch (err: unknown) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.' }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [messages, agentId, visitorId, isTest, conversationId, isLoading])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  return { messages, input, setInput, handleSubmit, isLoading, sendMessage }
}
