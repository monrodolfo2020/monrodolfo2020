import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeUrl } from '@/lib/ingestion/scraper'
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

  let domain: string
  try { domain = new URL(url).hostname } catch { return NextResponse.json({ error: 'URL no v\u00e1lida' }, { status: 400 }) }

  const admin = await createAdminClient()
  const { data: item, error: insertError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'url',
    title: domain,
    source_url: url,
    status: 'processing',
  }).select('id').single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  waitUntil(
    scrapeUrl(url).then(chunks => {
      if (chunks.length === 0) throw new Error('No se pudo extraer contenido de la p\u00e1gina')
      return storeEmbeddings(agentId, item!.id, chunks)
    }).catch(async (err) => {
      await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
    })
  )

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}
