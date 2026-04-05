import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ingestion/audio'
import { storeEmbeddings } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File
  const agentId = form.get('agentId') as string
  if (!file || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: item, error: itemError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'audio',
    title: file.name,
    status: 'processing',
  }).select('id').single()

  const buffer = Buffer.from(await file.arrayBuffer())
  
  processAudio(buffer, file.name, item!.id, agentId, admin).catch(async (err) => {
    await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
  })

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}

async function processAudio(buffer: Buffer, filename: string, itemId: string, agentId: string, admin: any) {
  const chunks = await transcribeAudio(buffer, filename)
  if (chunks.length === 0) throw new Error('No se pudo transcribir el audio')
  await storeEmbeddings(agentId, itemId, chunks)
}
