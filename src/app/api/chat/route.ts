import { streamText } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { retrieveContext } from '@/lib/ai/rag'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const context = await retrieveContext(agentId, lastUserMessage).catch(() => '')
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

    const result = streamText({
      model: openrouter(agent.model_id),
      system: systemPrompt,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      onFinish: async ({ text }) => {
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

    return result.toTextStreamResponse()
  } catch (err: unknown) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Error al procesar el chat' }, { status: 500 })
  }
}
