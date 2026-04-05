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

    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://agentforgez.vercel.app',
        'X-Title': 'AgentForge',
      },
      body: JSON.stringify({
        model: agent.model_id,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
      signal: abortController.signal,
    })

    if (!orResponse.ok) {
      clearTimeout(abortTimer)
      const errText = await orResponse.text()
      console.error('OpenRouter error:', orResponse.status, errText)
      return NextResponse.json(
        { error: `Error del modelo (${orResponse.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullText = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = orResponse.body?.getReader()
        if (!reader) {
          controller.enqueue(encoder.encode('[Error: no response body]'))
          controller.close()
          return
        }

        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (!trimmed.startsWith('data: ')) continue
              try {
                const json = JSON.parse(trimmed.slice(6)) as {
                  choices?: Array<{ delta?: { content?: string } }>
                }
                const text = json.choices?.[0]?.delta?.content
                if (text) {
                  fullText += text
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error desconocido'
          console.error('Stream error:', msg)
          controller.enqueue(encoder.encode(`[Error: ${msg}]`))
        } finally {
          clearTimeout(abortTimer)
          controller.close()

          if (convId) {
            await admin.from('messages').insert({
              conversation_id: convId,
              agent_id: agentId,
              role: 'assistant',
              content: fullText || '[sin respuesta]',
            })
            await admin.from('conversations')
              .update({ last_active: new Date().toISOString(), message_count: messages.length + 1 })
              .eq('id', convId)
          }
          await admin.from('agents').update({
            total_messages: agent.total_messages + 2,
            total_conversations: convId && !conversationId
              ? agent.total_conversations + 1
              : agent.total_conversations,
          }).eq('id', agentId)
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
