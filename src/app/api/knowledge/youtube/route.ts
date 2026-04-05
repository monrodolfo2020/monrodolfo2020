import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractYoutubeTranscript, extractYoutubeId } from '@/lib/ingestion/youtube'
import { storeEmbeddings } from '@/lib/ai/embeddings'
import { waitUntil } from '@vercel/functions'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { url, agentId } = await req.json()
  if (!url || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const videoId = extractYoutubeId(url)
  if (!videoId) return NextResponse.json({ error: 'URL de YouTube no v\u00e1lida' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: item, error: insertError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'youtube',
    title: `Video YouTube: ${videoId}`,
    source_url: url,
    status: 'processing',
  }).select('id').single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  waitUntil(
    extractYoutubeTranscript(url).then(chunks => {
      if (chunks.length === 0) throw new Error('No se encontr\u00f3 transcripci\u00f3n para este video')
      return storeEmbeddings(agentId, item!.id, chunks)
    }).catch(async (err) => {
      await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
    })
  )

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}
