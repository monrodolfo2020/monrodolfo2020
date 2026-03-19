import type { ScoringConfig } from '@mall/types'

// Default scoring configuration when none is set for a mall
export const DEFAULT_SCORING_CONFIG: Omit<ScoringConfig, 'id' | 'mall_id' | 'created_at' | 'updated_at'> = {
  weight_maintenance_completion: 30,
  weight_maintenance_timeliness: 20,
  weight_asset_status: 25,
  weight_findings_resolution: 15,
  weight_security_compliance: 10,
  on_time_bonus_hours: 0,
  late_penalty_per_hour: 2.0,
  max_late_penalty: 50,
}

// Asset type weights within the asset status dimension
export const ASSET_TYPE_WEIGHTS: Record<string, number> = {
  luminaire: 30,
  cctv_camera: 25,
  generator: 20,
  electrical_substation: 15,
  elevator: 10,
  escalator: 10,
  hvac: 10,
  water_treatment: 10,
  drinking_water_plant: 10,
  fire_suppression: 10,
  access_control: 5,
  wifi_access_point: 5,
}

// Finding severity score deductions (applied to overdue findings)
export const FINDING_SEVERITY_PENALTY: Record<string, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
}

export const MAX_FINDING_PENALTY = 50

// Score grade thresholds
export const SCORE_THRESHOLDS = {
  excelente: 90,
  bueno: 75,
  regular: 60,
  deficiente: 40,
} as const
