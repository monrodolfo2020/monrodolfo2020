import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'

export async function retrieveContext(agentId: string, query: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return ''

  const openai = new OpenAI({ apiKey, maxRetries: 0, timeout: 8000 })

  const embResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const queryEmbedding = embResponse.data[0].embedding

  const supabase = await createAdminClient()
  const { data: chunks, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_agent_id: agentId,
    match_count: 5,
    match_threshold: 0.65,
  })

  if (error || !chunks || chunks.length === 0) return ''

  return (chunks as Array<{ chunk_text: string }>)
    .map((c, i) => `[Conocimiento ${i + 1}]:\n${c.chunk_text}`)
    .join('\n\n---\n\n')
}
