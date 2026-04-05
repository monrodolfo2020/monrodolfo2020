import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(_: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  const shareToken = nanoid(12)

  const { data, error } = await admin
    .from('agents')
    .update({ is_published: true, share_token: shareToken })
    .eq('id', agentId).eq('user_id', user.id)
    .select('share_token').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${data.share_token}`
  return NextResponse.json({ shareUrl, shareToken: data.share_token })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = await createAdminClient()
  await admin.from('agents')
    .update({ is_published: false })
    .eq('id', agentId).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
