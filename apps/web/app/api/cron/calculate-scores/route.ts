import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Job: runs daily at 23:45 UTC
// Configure in vercel.json:
// { "crons": [{ "path": "/api/cron/calculate-scores", "schedule": "45 23 * * *" }] }
export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const periodType = searchParams.get('period') ?? 'daily'

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/calculate-scores`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ period_type: periodType }),
      },
    )

    const data = await res.json()
    return NextResponse.json({
      success: res.ok,
      status: res.status,
      period_type: periodType,
      data,
    })
  } catch (error) {
    console.error('[cron] calculate-scores error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
