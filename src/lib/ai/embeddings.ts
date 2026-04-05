import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map(d => d.embedding)
}

export async function storeEmbeddings(
  agentId: string,
  knowledgeItemId: string,
  chunks: string[]
) {
  const supabase = await createAdminClient()
  const BATCH_SIZE = 100

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await generateEmbeddings(batch)
    const rows = batch.map((chunk, j) => ({
      agent_id: agentId,
      knowledge_item_id: knowledgeItemId,
      chunk_index: i + j,
      chunk_text: chunk,
      embedding: JSON.stringify(embeddings[j]),
    }))
    const { error } = await supabase.from('embeddings').insert(rows)
    if (error) throw new Error(`Error guardando embeddings: ${error.message}`)
  }

  await supabase
    .from('knowledge_items')
    .update({ status: 'ready', chunk_count: chunks.length })
    .eq('id', knowledgeItemId)

  // Update agent's total_knowledge_items counter
  const { count } = await supabase
    .from('knowledge_items')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'ready')
  await supabase
    .from('agents')
    .update({ total_knowledge_items: count ?? 0 })
    .eq('id', agentId)
}
