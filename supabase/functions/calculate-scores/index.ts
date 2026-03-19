/**
 * Edge Function: calculate-scores
 *
 * Runs nightly at 02:00 UTC via pg_cron.
 * Calculates daily/weekly/monthly score snapshots for all active malls.
 * Uses the same scoring formula as packages/scoring/src/engine.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))

    // Determine period
    const now = new Date()
    const periodType: 'daily' | 'weekly' | 'monthly' = body.period_type ?? 'daily'

    const { periodStart, periodEnd } = getPeriodBounds(now, periodType)
    const periodStartStr = periodStart.toISOString().split('T')[0]
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    // Get malls to score
    let mallsQuery = supabase
      .from('malls')
      .select('id')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (body.mall_id) {
      mallsQuery = mallsQuery.eq('id', body.mall_id)
    }

    const { data: malls, error: mallsError } = await mallsQuery
    if (mallsError) throw mallsError

    let snapshotsCreated = 0

    for (const mall of malls ?? []) {
      const snapshot = await calculateMallScore(
        supabase, mall.id, periodType, periodStartStr, periodEndStr, now
      )

      // Upsert snapshot
      const { error } = await supabase
        .from('score_snapshots')
        .upsert(snapshot, { onConflict: 'mall_id,period_type,period_start' })

      if (error) {
        console.warn('Score snapshot error for mall', mall.id, ':', error.message)
      } else {
        snapshotsCreated++
      }
    }

    return jsonResponse({
      snapshots_created: snapshotsCreated,
      period_type: periodType,
      period_start: periodStartStr,
      period_end: periodEndStr,
    })
  } catch (error) {
    console.error('[calculate-scores]', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
})

async function calculateMallScore(
  supabase: ReturnType<typeof createClient>,
  mallId: string,
  periodType: string,
  periodStart: string,
  periodEnd: string,
  now: Date
) {
  // Fetch scoring config
  const { data: config } = await supabase
    .from('scoring_config')
    .select('*')
    .eq('mall_id', mallId)
    .single()

  const weights = config ?? {
    weight_maintenance_completion: 30,
    weight_maintenance_timeliness: 20,
    weight_asset_status: 25,
    weight_findings_resolution: 15,
    weight_security_compliance: 10,
    late_penalty_per_hour: 2.0,
    max_late_penalty: 50,
  }

  // ─── Dimension 1 & 2: Maintenance ────────────────────────────────────────

  const { data: tasks } = await supabase
    .from('maintenance_tasks')
    .select('status, scheduled_date, scheduled_time, completed_at')
    .eq('mall_id', mallId)
    .gte('scheduled_date', periodStart)
    .lte('scheduled_date', periodEnd)

  const tasksArr = tasks ?? []
  const tasksScheduled = tasksArr.length
  const tasksCompleted = tasksArr.filter((t: { status: string }) =>
    t.status === 'completed' || t.status === 'validated'
  ).length
  const tasksMissed = tasksArr.filter((t: { status: string }) => t.status === 'missed').length

  const completionScore = tasksScheduled === 0
    ? 100
    : round2((tasksCompleted / tasksScheduled) * 100)

  const completedWithTime = tasksArr.filter((t: { status: string; completed_at: string | null }) =>
    (t.status === 'completed' || t.status === 'validated') && t.completed_at
  )

  let timelinessScore = 100
  if (completedWithTime.length > 0) {
    const scores = completedWithTime.map((task: {
      scheduled_date: string
      scheduled_time: string | null
      completed_at: string
    }) => {
      const deadline = new Date(`${task.scheduled_date}T${task.scheduled_time ?? '23:59'}:00`)
      const completedAt = new Date(task.completed_at)
      const msLate = Math.max(0, completedAt.getTime() - deadline.getTime())
      const hoursLate = msLate / 3600000
      const penalty = Math.min(hoursLate * weights.late_penalty_per_hour, weights.max_late_penalty)
      return Math.max(0, 100 - penalty)
    })
    timelinessScore = round2(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
  }

  // ─── Dimension 3: Asset Status ────────────────────────────────────────────

  const { data: assetRecords } = await supabase
    .from('asset_score_records')
    .select('asset_type, total_count, operational_count, score_percentage, recorded_date')
    .eq('mall_id', mallId)
    .gte('recorded_date', periodStart)
    .lte('recorded_date', periodEnd)
    .order('recorded_date', { ascending: false })

  const ASSET_WEIGHTS: Record<string, number> = {
    luminaire: 30, cctv_camera: 25, generator: 20,
    electrical_substation: 15, elevator: 10, default: 10,
  }

  const latestByType = new Map<string, number>()
  for (const r of (assetRecords ?? [])) {
    if (!latestByType.has(r.asset_type)) {
      latestByType.set(r.asset_type, r.score_percentage)
    }
  }

  let assetScore = 100
  if (latestByType.size > 0) {
    let totalWeight = 0
    let weightedSum = 0
    for (const [type, pct] of latestByType.entries()) {
      const w = ASSET_WEIGHTS[type] ?? ASSET_WEIGHTS['default']
      weightedSum += pct * w
      totalWeight += w
    }
    assetScore = round2(totalWeight > 0 ? weightedSum / totalWeight : 100)
  }

  // ─── Dimension 4: Findings Resolution ────────────────────────────────────

  const { data: findings } = await supabase
    .from('findings')
    .select('severity, status, resolution_date, resolved_at, created_at')
    .eq('mall_id', mallId)
    .or(`created_at.gte.${periodStart},resolution_date.lte.${periodEnd}`)

  const findingsArr = findings ?? []
  const findingsTotal = findingsArr.length

  const findingsResolvedOnTime = findingsArr.filter((f: {
    status: string
    resolved_at: string | null
    resolution_date: string | null
  }) =>
    f.status === 'resolved' &&
    f.resolved_at && f.resolution_date &&
    new Date(f.resolved_at) <= new Date(f.resolution_date)
  ).length

  let findingsScore = findingsTotal === 0
    ? 100
    : round2((findingsResolvedOnTime / findingsTotal) * 100)

  const SEVERITY_PENALTIES: Record<string, number> = { critical: 15, high: 8, medium: 4, low: 1 }
  let totalPenalty = 0

  for (const f of findingsArr) {
    if (f.status === 'resolved') continue
    if (!f.resolution_date) continue
    if (new Date(f.resolution_date) < now) {
      totalPenalty += SEVERITY_PENALTIES[(f as { severity: string }).severity] ?? 0
    }
  }

  findingsScore = Math.max(0, findingsScore - Math.min(totalPenalty, 50))

  // ─── Dimension 5: Security Compliance ────────────────────────────────────

  const { data: expectedScansData } = await supabase.rpc('count_expected_scans', {
    p_mall_id: mallId,
    p_start: periodStart,
    p_end: periodEnd,
  })

  const { data: actualScansData } = await supabase
    .from('checkpoint_scans')
    .select('id', { count: 'exact', head: true })
    .eq('mall_id', mallId)
    .eq('qr_verified', true)
    .eq('geolocation_valid', true)
    .gte('scanned_at', `${periodStart}T00:00:00Z`)
    .lte('scanned_at', `${periodEnd}T23:59:59Z`)

  const expectedScans = (expectedScansData as number | null) ?? 0
  const actualScans = (actualScansData as { count: number } | null)?.count ?? 0
  const securityScore = expectedScans === 0
    ? 100
    : round2(Math.min((actualScans / expectedScans) * 100, 100))

  // ─── Weighted Total ───────────────────────────────────────────────────────

  const totalScore = round2(
    completionScore * (weights.weight_maintenance_completion / 100) +
    timelinessScore * (weights.weight_maintenance_timeliness / 100) +
    assetScore * (weights.weight_asset_status / 100) +
    findingsScore * (weights.weight_findings_resolution / 100) +
    securityScore * (weights.weight_security_compliance / 100)
  )

  const metadata = {
    tasks_scheduled: tasksScheduled,
    tasks_completed: tasksCompleted,
    tasks_missed: tasksMissed,
    avg_timeliness_score: timelinessScore,
    assets_by_type: Object.fromEntries(latestByType.entries()),
    findings_total: findingsTotal,
    findings_resolved_on_time: findingsResolvedOnTime,
    expected_scans: expectedScans,
    actual_valid_scans: actualScans,
  }

  return {
    mall_id: mallId,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    score_maintenance_completion: completionScore,
    score_maintenance_timeliness: timelinessScore,
    score_asset_status: assetScore,
    score_findings_resolution: findingsScore,
    score_security_compliance: securityScore,
    total_score: totalScore,
    metadata,
    calculated_at: new Date().toISOString(),
  }
}

function getPeriodBounds(now: Date, periodType: string) {
  const d = new Date(now)

  if (periodType === 'daily') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
    const end = new Date(start)
    return { periodStart: start, periodEnd: end }
  }

  if (periodType === 'weekly') {
    const dayOfWeek = d.getDay()
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - 7
    const start = new Date(d.getFullYear(), d.getMonth(), diff)
    const end = new Date(start.getTime() + 6 * 86400000)
    return { periodStart: start, periodEnd: end }
  }

  // monthly (default)
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  const end = new Date(d.getFullYear(), d.getMonth(), 0)
  return { periodStart: start, periodEnd: end }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
