import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractYoutubeTranscript, extractYoutubeId } from '@/lib/ingestion/youtube'
import { storeEmbeddings } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { url, agentId } = await req.json()
  if (!url || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const videoId = extractYoutubeId(url)
  if (!videoId) return NextResponse.json({ error: 'URL de YouTube no válida' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: item, error: itemError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'youtube',
    title: `Video YouTube: ${videoId}`,
    source_url: url,
    status: 'processing',
  }).select('id').single()

  processYoutube(url, item!.id, agentId, admin).catch(async (err) => {
    await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
  })

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}

async function processYoutube(url: string, itemId: string, agentId: string, admin: any) {
  const chunks = await extractYoutubeTranscript(url)
  if (chunks.length === 0) throw new Error('No se encontró transcripción para este video')
  await storeEmbeddings(agentId, itemId, chunks)
}
