import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabase.from('knowledge_items')
    .select('*').eq('agent_id', agentId).order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
