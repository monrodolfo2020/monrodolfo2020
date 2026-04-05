import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { chunkText } from '@/lib/ingestion/chunker'
import { storeEmbeddings } from '@/lib/ai/embeddings'
import { waitUntil } from '@vercel/functions'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { text, title, agentId } = await req.json()
  if (!text || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: item, error: insertError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'text',
    title: title || 'Texto manual',
    status: 'processing',
  }).select('id').single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const chunks = chunkText(text)

  waitUntil(
    storeEmbeddings(agentId, item!.id, chunks).catch(async (err) => {
      await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
    })
  )

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}
