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

const TIMEOUT_MS = 35000 // 35s client-side timeout

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

    const controller = new AbortController()
    const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          agentId,
          visitorId,
          isTest,
          conversationId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      clearTimeout(abortTimer)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Error del servidor (${res.status})`)
      }

      const convId = res.headers.get('X-Conversation-Id')
      if (convId) setConversationId(convId)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No se pudo leer la respuesta')

      let accumulated = ''
      let readTimer: ReturnType<typeof setTimeout>
      const resetReadTimer = () => {
        clearTimeout(readTimer)
        readTimer = setTimeout(() => reader.cancel('read timeout'), 30000)
      }

      resetReadTimer()
      while (true) {
        const { done, value } = await reader.read()
        clearTimeout(readTimer)
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ))
        resetReadTimer()
      }
      clearTimeout(readTimer!)

      if (!accumulated) {
        throw new Error('El modelo no devolvi\u00f3 respuesta. Intenta de nuevo.')
      }
    } catch (err: unknown) {
      clearTimeout(abortTimer)
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      const msg = isAbort
        ? 'Tiempo de espera agotado (35s). El modelo gratuito puede estar lento, intenta de nuevo.'
        : (err instanceof Error ? err.message : 'Error desconocido')
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `\u26a0\ufe0f ${msg}` } : m
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
