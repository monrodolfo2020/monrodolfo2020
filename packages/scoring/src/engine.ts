import type { ScoringConfig, ScoreMetadata, FindingSeverity } from '@mall/types'
import {
  DEFAULT_SCORING_CONFIG,
  ASSET_TYPE_WEIGHTS,
  FINDING_SEVERITY_PENALTY,
  MAX_FINDING_PENALTY,
} from './rules'

// ─── Input Data Types ─────────────────────────────────────────────────────────

export interface MaintenanceTaskData {
  status: string
  scheduled_date: string
  scheduled_time: string | null
  completed_at: string | null
}

export interface FindingData {
  severity: FindingSeverity
  status: string
  resolution_date: string | null
  resolved_at: string | null
  created_at: string
}

export interface AssetData {
  asset_type: string
  total_count: number
  operational_count: number
}

export interface SecurityScanData {
  expected_scans: number
  actual_valid_scans: number
}

export interface ScoringInput {
  tasks: MaintenanceTaskData[]
  findings: FindingData[]
  assets: AssetData[]
  security: SecurityScanData
  config?: Partial<typeof DEFAULT_SCORING_CONFIG>
  now?: Date
}

export interface ScoringResult {
  score_maintenance_completion: number
  score_maintenance_timeliness: number
  score_asset_status: number
  score_findings_resolution: number
  score_security_compliance: number
  total_score: number
  metadata: ScoreMetadata
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ─── Dimension Calculators ────────────────────────────────────────────────────

/**
 * Dimension 1: Maintenance Completion (default 30%)
 * Score = completed tasks / scheduled tasks * 100
 */
function calcMaintenanceCompletion(tasks: MaintenanceTaskData[]): {
  score: number
  tasks_scheduled: number
  tasks_completed: number
  tasks_missed: number
} {
  if (tasks.length === 0) return { score: 100, tasks_scheduled: 0, tasks_completed: 0, tasks_missed: 0 }

  const tasks_scheduled = tasks.length
  const tasks_completed = tasks.filter((t) =>
    t.status === 'completed' || t.status === 'validated'
  ).length
  const tasks_missed = tasks.filter((t) => t.status === 'missed').length

  const score = round2((tasks_completed / tasks_scheduled) * 100)
  return { score, tasks_scheduled, tasks_completed, tasks_missed }
}

/**
 * Dimension 2: Maintenance Timeliness (default 20%)
 * For each completed task: 100 - (hours_late * penalty_per_hour), capped by max_late_penalty
 * Period score = average of all task timeliness scores
 */
function calcMaintenanceTimeliness(
  tasks: MaintenanceTaskData[],
  config: Pick<ScoringConfig, 'late_penalty_per_hour' | 'max_late_penalty'>,
  now: Date
): { score: number; avg_timeliness_score: number } {
  const completedTasks = tasks.filter(
    (t) => (t.status === 'completed' || t.status === 'validated') && t.completed_at
  )

  if (completedTasks.length === 0) return { score: 100, avg_timeliness_score: 100 }

  const taskScores = completedTasks.map((task) => {
    const scheduledDateTime = new Date(
      `${task.scheduled_date}T${task.scheduled_time ?? '23:59'}:00`
    )
    const completedAt = new Date(task.completed_at!)

    const msLate = Math.max(0, completedAt.getTime() - scheduledDateTime.getTime())
    const hoursLate = msLate / (1000 * 60 * 60)
    const penalty = Math.min(hoursLate * config.late_penalty_per_hour, config.max_late_penalty)

    return clamp(100 - penalty, 0, 100)
  })

  const avg = taskScores.reduce((sum, s) => sum + s, 0) / taskScores.length
  const score = round2(avg)
  return { score, avg_timeliness_score: score }
}

/**
 * Dimension 3: Asset Operational Status (default 25%)
 * Weighted average of (operational/total) per asset type
 */
function calcAssetStatus(assets: AssetData[]): {
  score: number
  assets_by_type: Record<string, { total: number; operational: number; score: number }>
} {
  if (assets.length === 0) return { score: 100, assets_by_type: {} }

  const assets_by_type: Record<string, { total: number; operational: number; score: number }> = {}

  for (const asset of assets) {
    const typeScore = asset.total_count === 0
      ? 100
      : round2((asset.operational_count / asset.total_count) * 100)

    assets_by_type[asset.asset_type] = {
      total: asset.total_count,
      operational: asset.operational_count,
      score: typeScore,
    }
  }

  // Weighted average using ASSET_TYPE_WEIGHTS; equal weight for types not in the map
  let totalWeight = 0
  let weightedSum = 0

  for (const [assetType, data] of Object.entries(assets_by_type)) {
    const weight = ASSET_TYPE_WEIGHTS[assetType] ?? 10
    weightedSum += data.score * weight
    totalWeight += weight
  }

  const score = totalWeight === 0 ? 100 : round2(weightedSum / totalWeight)
  return { score, assets_by_type }
}

/**
 * Dimension 4: Findings Resolution (default 15%)
 * (resolved on time / total) * 100, minus severity penalties for overdue findings
 */
function calcFindingsResolution(findings: FindingData[], now: Date): {
  score: number
  findings_total: number
  findings_resolved_on_time: number
} {
  if (findings.length === 0) return { score: 100, findings_total: 0, findings_resolved_on_time: 0 }

  const findings_total = findings.length
  const findings_resolved_on_time = findings.filter((f) => {
    if (f.status !== 'resolved' || !f.resolved_at || !f.resolution_date) return false
    return new Date(f.resolved_at) <= new Date(f.resolution_date)
  }).length

  const baseScore = round2((findings_resolved_on_time / findings_total) * 100)

  // Calculate severity penalties for overdue (unresolved past deadline) findings
  let totalPenalty = 0
  for (const finding of findings) {
    if (finding.status === 'resolved') continue
    if (!finding.resolution_date) continue
    const isOverdue = new Date(finding.resolution_date) < now
    if (isOverdue) {
      totalPenalty += FINDING_SEVERITY_PENALTY[finding.severity] ?? 0
    }
  }

  const score = clamp(baseScore - Math.min(totalPenalty, MAX_FINDING_PENALTY), 0, 100)
  return { score: round2(score), findings_total, findings_resolved_on_time }
}

/**
 * Dimension 5: Security Round Compliance (default 10%)
 * valid_scans / expected_scans * 100
 */
function calcSecurityCompliance(security: SecurityScanData): {
  score: number
  expected_scans: number
  actual_valid_scans: number
} {
  if (security.expected_scans === 0) return {
    score: 100,
    expected_scans: 0,
    actual_valid_scans: 0,
  }

  const score = round2(
    clamp((security.actual_valid_scans / security.expected_scans) * 100, 0, 100)
  )
  return { score, expected_scans: security.expected_scans, actual_valid_scans: security.actual_valid_scans }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function calculateScore(input: ScoringInput): ScoringResult {
  const config: ScoringConfig = { ...DEFAULT_SCORING_CONFIG, ...input.config } as ScoringConfig
  const now = input.now ?? new Date()

  const completion = calcMaintenanceCompletion(input.tasks)
  const timeliness = calcMaintenanceTimeliness(input.tasks, config, now)
  const assets = calcAssetStatus(input.assets)
  const findings = calcFindingsResolution(input.findings, now)
  const security = calcSecurityCompliance(input.security)

  // Weighted final score
  const total_score = round2(
    completion.score * (config.weight_maintenance_completion / 100) +
    timeliness.score * (config.weight_maintenance_timeliness / 100) +
    assets.score * (config.weight_asset_status / 100) +
    findings.score * (config.weight_findings_resolution / 100) +
    security.score * (config.weight_security_compliance / 100)
  )

  const metadata: ScoreMetadata = {
    tasks_scheduled: completion.tasks_scheduled,
    tasks_completed: completion.tasks_completed,
    tasks_missed: completion.tasks_missed,
    avg_timeliness_score: timeliness.avg_timeliness_score,
    assets_by_type: assets.assets_by_type,
    findings_total: findings.findings_total,
    findings_resolved_on_time: findings.findings_resolved_on_time,
    expected_scans: security.expected_scans,
    actual_valid_scans: security.actual_valid_scans,
  }

  return {
    score_maintenance_completion: completion.score,
    score_maintenance_timeliness: timeliness.score,
    score_asset_status: assets.score,
    score_findings_resolution: findings.score,
    score_security_compliance: security.score,
    total_score,
    metadata,
  }
}
