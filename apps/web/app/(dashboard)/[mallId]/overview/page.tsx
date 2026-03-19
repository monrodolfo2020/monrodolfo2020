import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ScoreCard } from '@/components/dashboard/score-card'
import { TaskSummaryCard } from '@/components/dashboard/task-summary-card'
import { FindingsSummaryCard } from '@/components/dashboard/findings-summary-card'
import { AssetStatusCard } from '@/components/dashboard/asset-status-card'
import { ScoreTrendChart } from '@/components/dashboard/score-trend-chart'
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns'

export const metadata: Metadata = { title: 'Resumen' }

interface PageProps {
  params: Promise<{ mallId: string }>
}

export default async function OverviewPage({ params }: PageProps) {
  const { mallId } = await params
  const supabase = await createClient()

  // Verify mall access
  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(startOfDay(today), 'yyyy-MM-dd')

  // Fetch data in parallel
  const [
    { data: latestScore },
    { data: scoreHistory },
    { data: todayTasks },
    { data: openFindings },
    { data: assetScores },
  ] = await Promise.all([
    supabase
      .from('score_snapshots')
      .select('*')
      .eq('mall_id', mallId)
      .eq('period_type', 'monthly')
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('score_snapshots')
      .select('period_start, period_end, total_score, score_maintenance_completion, score_asset_status')
      .eq('mall_id', mallId)
      .eq('period_type', 'monthly')
      .order('period_end', { ascending: false })
      .limit(6),

    supabase
      .from('maintenance_tasks')
      .select('status, title, scheduled_time, assigned_to(full_name)')
      .eq('mall_id', mallId)
      .eq('scheduled_date', todayStr)
      .order('scheduled_time'),

    supabase
      .from('findings')
      .select('id, title, severity, status, resolution_date, created_at')
      .eq('mall_id', mallId)
      .in('status', ['open', 'in_progress'])
      .order('severity', { ascending: false })
      .limit(10),

    supabase
      .from('asset_score_records')
      .select('asset_type, total_count, operational_count, score_percentage, recorded_date')
      .eq('mall_id', mallId)
      .gte('recorded_date', monthStart)
      .order('recorded_date', { ascending: false }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mall.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(today, "EEEE d 'de' MMMM, yyyy")}
          </p>
        </div>
      </div>

      {/* KPI Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Puntaje Global"
          score={latestScore?.total_score ?? null}
          period="Este mes"
          highlighted
        />
        <ScoreCard
          title="Mantenimiento"
          score={latestScore?.score_maintenance_completion ?? null}
          period="Este mes"
        />
        <ScoreCard
          title="Estado de Activos"
          score={latestScore?.score_asset_status ?? null}
          period="Este mes"
        />
        <ScoreCard
          title="Seguridad"
          score={latestScore?.score_security_compliance ?? null}
          period="Este mes"
        />
      </div>

      {/* Charts + Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScoreTrendChart data={scoreHistory ?? []} />
        </div>
        <div className="space-y-4">
          <TaskSummaryCard tasks={todayTasks ?? []} />
          <FindingsSummaryCard findings={openFindings ?? []} />
        </div>
      </div>

      {/* Asset Status */}
      <AssetStatusCard records={assetScores ?? []} />
    </div>
  )
}
