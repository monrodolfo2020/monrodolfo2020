import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Supabase sends a webhook-secret header for verification
// Set SUPABASE_WEBHOOK_SECRET in Vercel environment variables
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET ?? ''

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true // Skip in dev if not configured
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', ''), 'hex'),
    Buffer.from(expected, 'hex'),
  )
}

type SupabaseWebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-supabase-signature') ?? ''

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: SupabaseWebhookPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle CSV import job trigger
  if (
    payload.table === 'inventory_import_jobs' &&
    payload.type === 'INSERT' &&
    payload.record?.status === 'pending'
  ) {
    const jobId = payload.record.id as string

    // Trigger the Edge Function to process the CSV
    const { error } = await supabase.functions.invoke('process-csv-import', {
      body: { job_id: jobId },
    })

    if (error) {
      console.error('[webhook] process-csv-import failed:', error)
      // Don't return error — Supabase will retry
      return NextResponse.json({ received: true, processed: false })
    }

    return NextResponse.json({ received: true, processed: true, job_id: jobId })
  }

  // Handle score_snapshot triggers — could send email/push notification
  if (
    payload.table === 'score_snapshots' &&
    payload.type === 'INSERT' &&
    payload.record?.period_type === 'monthly'
  ) {
    const snapshot = payload.record
    console.log(
      `[webhook] Monthly score for mall ${snapshot.mall_id}: ${snapshot.total_score}`,
    )
    // TODO: send email report via Resend/SendGrid
  }

  return NextResponse.json({ received: true })
}
