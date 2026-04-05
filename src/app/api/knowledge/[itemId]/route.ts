import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabase.from('knowledge_items')
    .select('id, status, chunk_count, error_message').eq('id', itemId).single()
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  await admin.from('knowledge_items').delete().eq('id', itemId).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
