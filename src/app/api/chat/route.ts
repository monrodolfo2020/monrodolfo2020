import { streamText } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { retrieveContext } from '@/lib/ai/rag'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

export async function POST(req: Request) {
  try {
    const { messages, agentId, conversationId, visitorId, isTest } = await req.json()

    if (!agentId || !messages?.length) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const { data: agent, error: agentError } = await admin
      .from('agents').select('*').eq('id', agentId).single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    if (!agent.is_published && !isTest) {
      return NextResponse.json({ error: 'Agente no disponible' }, { status: 403 })
    }

    const lastUserMessage = messages[messages.length - 1]?.content || ''

    const context = await withTimeout(
      retrieveContext(agentId, lastUserMessage).catch(() => ''),
      8000,
      ''
    )

    const systemPrompt = buildSystemPrompt(agent, context)

    let convId = conversationId
    if (!convId) {
      const { data: conv } = await admin.from('conversations').insert({
        agent_id: agentId,
        visitor_id: visitorId || null,
        is_test: isTest || false,
      }).select('id').single()
      convId = conv?.id
    }

    if (convId) {
      await admin.from('messages').insert({
        conversation_id: convId,
        agent_id: agentId,
        role: 'user',
        content: lastUserMessage,
      })
    }

    const abortController = new AbortController()
    const abortTimer = setTimeout(() => abortController.abort(), 50000)

    const result = streamText({
      model: openrouter(agent.model_id),
      system: systemPrompt,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      abortSignal: abortController.signal,
      onFinish: async ({ text }) => {
        clearTimeout(abortTimer)
        if (convId) {
          await admin.from('messages').insert({
            conversation_id: convId,
            agent_id: agentId,
            role: 'assistant',
            content: text,
          })
          await admin.from('conversations')
            .update({ last_active: new Date().toISOString(), message_count: messages.length + 1 })
            .eq('id', convId)
        }
        await admin.from('agents')
          .update({
            total_messages: agent.total_messages + 2,
            total_conversations: convId && !conversationId
              ? agent.total_conversations + 1 : agent.total_conversations,
          })
          .eq('id', agentId)
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error desconocido'
          console.error('Stream error:', msg)
          controller.enqueue(encoder.encode(`[Error: ${msg}]`))
        } finally {
          clearTimeout(abortTimer)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: unknown) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Error al procesar el chat' }, { status: 500 })
  }
}
