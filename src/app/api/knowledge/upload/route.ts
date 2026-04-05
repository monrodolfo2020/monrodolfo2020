import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { storeEmbeddings } from '@/lib/ai/embeddings'
import { extractPdfText } from '@/lib/ingestion/pdf'
import { extractDocxText } from '@/lib/ingestion/docx'
import { chunkText } from '@/lib/ingestion/chunker'
import { waitUntil } from '@vercel/functions'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File
  const agentId = form.get('agentId') as string

  if (!file || !agentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedTypes = ['pdf', 'docx', 'txt']
  if (!allowedTypes.includes(ext)) {
    return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: item, error: insertError } = await admin.from('knowledge_items').insert({
    agent_id: agentId,
    user_id: user.id,
    source_type: ext === 'txt' ? 'text' : ext,
    title: file.name,
    status: 'processing',
  }).select('id').single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const buffer = Buffer.from(await file.arrayBuffer())

  waitUntil(
    processDocument(buffer, ext, item!.id, agentId, admin).catch(async (err) => {
      await admin.from('knowledge_items').update({
        status: 'error',
        error_message: err.message,
      }).eq('id', item!.id)
    })
  )

  return NextResponse.json({ id: item!.id, status: 'processing' }, { status: 202 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processDocument(buffer: Buffer, ext: string, itemId: string, agentId: string, admin: any) {
  let chunks: string[]

  if (ext === 'pdf') {
    chunks = await extractPdfText(buffer)
  } else if (ext === 'docx') {
    chunks = await extractDocxText(buffer)
  } else {
    chunks = chunkText(buffer.toString('utf-8'))
  }

  if (chunks.length === 0) throw new Error('No se pudo extraer texto del archivo')

  await storeEmbeddings(agentId, itemId, chunks)
}
