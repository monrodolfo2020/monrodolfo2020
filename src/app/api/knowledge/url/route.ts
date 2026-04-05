import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeUrl } from '@/lib/ingestion/scraper'
import { storeEmbeddings } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { url, agentId } = await req.json()
  if (!url || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  let domain: string
  try { domain = new URL(url).hostname } catch { return NextResponse.json({ error: 'URL no válida' }, { status: 400 }) }

  const admin = await createAdminClient()
  const { data: item, error: itemError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: 'url',
    title: domain,
    source_url: url,
    status: 'processing',
  }).select('id').single()

  processUrl(url, item!.id, agentId, admin).catch(async (err) => {
    await admin.from('knowledge_items').update({ status: 'error', error_message: err.message }).eq('id', item!.id)
  })

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}

async function processUrl(url: string, itemId: string, agentId: string, admin: any) {
  const chunks = await scrapeUrl(url)
  if (chunks.length === 0) throw new Error('No se pudo extraer contenido de la página')
  await storeEmbeddings(agentId, itemId, chunks)
}
