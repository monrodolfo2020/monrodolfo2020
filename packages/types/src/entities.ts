// ─── Core Entities ───────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'mall_admin'
  | 'maintenance_chief'
  | 'maintenance_operator'
  | 'security_guard'
  | 'viewer'

export type SubscriptionPlan = 'standard' | 'premium'

export interface Mall {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  country: string
  timezone: string
  logo_url: string | null
  is_active: boolean
  subscription_plan: SubscriptionPlan
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserProfile {
  id: string
  mall_id: string | null
  full_name: string
  phone: string | null
  employee_code: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

// ─── Infrastructure ───────────────────────────────────────────────────────────

export type ZoneType =
  | 'parking'
  | 'retail'
  | 'kiosk'
  | 'common_area'
  | 'technical'
  | 'admin'
  | 'food_court'
  | 'exterior'

export interface MallZone {
  id: string
  mall_id: string
  name: string
  zone_type: ZoneType
  floor_level: number
  area_sqm: number | null
  description: string | null
  map_coordinates: GeoJSONPolygon | null
  created_at: string
  updated_at: string
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface RetailSpace {
  id: string
  mall_id: string
  zone_id: string | null
  space_number: string
  space_type: 'retail' | 'island' | 'kiosk' | 'anchor' | null
  area_sqm: number | null
  tenant_name: string | null
  tenant_contact: string | null
  is_occupied: boolean
  monthly_rent: number | null
  lease_start: string | null
  lease_end: string | null
  created_at: string
  updated_at: string
}

export type AssetType =
  | 'luminaire'
  | 'generator'
  | 'electrical_substation'
  | 'cctv_camera'
  | 'access_control'
  | 'water_treatment'
  | 'drinking_water_plant'
  | 'wifi_access_point'
  | 'fire_suppression'
  | 'elevator'
  | 'escalator'
  | 'hvac'

export type AssetStatus = 'operational' | 'degraded' | 'failed' | 'under_maintenance' | 'decommissioned'

export interface Asset {
  id: string
  mall_id: string
  zone_id: string | null
  asset_type: AssetType
  name: string
  code: string | null
  serial_number: string | null
  brand: string | null
  model: string | null
  install_date: string | null
  warranty_end: string | null
  status: AssetStatus
  location_notes: string | null
  specifications: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ─── Maintenance ─────────────────────────────────────────────────────────────

export type MaintenanceCategory =
  | 'cleaning'
  | 'water'
  | 'electrical'
  | 'security_systems'
  | 'networks'
  | 'lighting'
  | 'hvac'
  | 'fire_safety'
  | 'general'

export interface MaintenanceActivityType {
  id: string
  mall_id: string
  name: string
  category: MaintenanceCategory
  description: string | null
  estimated_duration_minutes: number
  requires_photos: boolean
  photo_count_required: number
  scoring_weight: number
  sop_url: string | null
  created_at: string
  updated_at: string
}

export type MaintenanceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'

export interface MaintenanceScheduleTemplate {
  id: string
  mall_id: string
  activity_type_id: string
  frequency: MaintenanceFrequency
  days_of_week: number[] | null
  day_of_month: number | null
  week_numbers: number[] | null
  preferred_time: string
  assigned_role: string
  zone_id: string | null
  asset_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MaintenanceTaskStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'validated'
  | 'rejected'
  | 'missed'

export interface MaintenanceTask {
  id: string
  mall_id: string
  template_id: string | null
  activity_type_id: string
  zone_id: string | null
  asset_id: string | null
  title: string
  description: string | null
  scheduled_date: string
  scheduled_time: string | null
  assigned_to: string | null
  started_at: string | null
  completed_at: string | null
  validated_at: string | null
  validated_by: string | null
  status: MaintenanceTaskStatus
  rejection_reason: string | null
  score_earned: number | null
  score_possible: number | null
  client_id: string | null
  synced_at: string | null
  created_at: string
  updated_at: string
}

export interface MaintenancePhoto {
  id: string
  mall_id: string
  task_id: string
  photo_url: string
  thumbnail_url: string | null
  caption: string | null
  taken_at: string
  taken_by: string | null
  geolocation: Geolocation | null
  file_size_bytes: number | null
  client_id: string | null
  local_path: string | null
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  synced_at: string | null
  created_at: string
}

export interface Geolocation {
  lat: number
  lng: number
  accuracy: number
  altitude?: number
}

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical'
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed'

export interface Finding {
  id: string
  mall_id: string
  task_id: string | null
  zone_id: string | null
  asset_id: string | null
  reported_by: string
  title: string
  description: string
  severity: FindingSeverity
  status: FindingStatus
  resolution_date: string | null
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  affects_score: boolean
  score_deduction: number
  client_id: string | null
  synced_at: string | null
  created_at: string
  updated_at: string
}

// ─── Security ─────────────────────────────────────────────────────────────────

export interface SecurityCheckpoint {
  id: string
  mall_id: string
  zone_id: string | null
  name: string
  location_notes: string | null
  qr_code: string
  qr_secret: string
  geolocation: Geolocation | null
  geofence_radius_meters: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PatrolRoute {
  id: string
  mall_id: string
  name: string
  description: string | null
  checkpoint_sequence: string[]
  expected_duration_minutes: number | null
  schedule_type: 'fixed' | 'interval' | 'random' | null
  scheduled_times: string[] | null
  interval_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PatrolSessionStatus = 'in_progress' | 'completed' | 'incomplete' | 'abandoned'

export interface PatrolSession {
  id: string
  mall_id: string
  route_id: string
  guard_id: string
  started_at: string
  completed_at: string | null
  status: PatrolSessionStatus
  completion_percentage: number
  notes: string | null
  client_id: string | null
  synced_at: string | null
  created_at: string
  updated_at: string
}

export interface CheckpointScan {
  id: string
  mall_id: string
  session_id: string
  checkpoint_id: string
  guard_id: string
  scanned_at: string
  server_received_at: string
  qr_payload: string
  qr_verified: boolean
  geolocation: Geolocation
  geolocation_valid: boolean
  device_info: Record<string, unknown> | null
  client_id: string | null
  synced_at: string | null
  created_at: string
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryCategory =
  | 'lighting'
  | 'electrical'
  | 'plumbing'
  | 'cleaning_supplies'
  | 'hardware'
  | 'fuel'
  | 'safety'
  | 'paint'
  | 'hvac'
  | 'other'

export interface InventoryItem {
  id: string
  mall_id: string
  sku: string | null
  name: string
  category: InventoryCategory
  unit_of_measure: string
  unit_cost: number | null
  minimum_stock: number
  current_stock: number
  maximum_stock: number | null
  location_notes: string | null
  supplier_name: string | null
  supplier_contact: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StockMovementType =
  | 'initial_load'
  | 'purchase'
  | 'consumption'
  | 'adjustment'
  | 'return'
  | 'waste'

export interface StockMovement {
  id: string
  mall_id: string
  item_id: string
  movement_type: StockMovementType
  quantity: number
  unit_cost: number | null
  stock_before: number | null
  stock_after: number | null
  task_id: string | null
  performed_by: string | null
  notes: string | null
  reference_doc: string | null
  movement_date: string
  client_id: string | null
  synced_at: string | null
  created_at: string
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoringConfig {
  id: string
  mall_id: string
  weight_maintenance_completion: number
  weight_maintenance_timeliness: number
  weight_asset_status: number
  weight_findings_resolution: number
  weight_security_compliance: number
  on_time_bonus_hours: number
  late_penalty_per_hour: number
  max_late_penalty: number
  created_at: string
  updated_at: string
}

export type PeriodType = 'daily' | 'weekly' | 'monthly'

export interface ScoreSnapshot {
  id: string
  mall_id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  score_maintenance_completion: number | null
  score_maintenance_timeliness: number | null
  score_asset_status: number | null
  score_findings_resolution: number | null
  score_security_compliance: number | null
  total_score: number | null
  metadata: ScoreMetadata | null
  calculated_at: string
  created_at: string
}

export interface ScoreMetadata {
  tasks_scheduled: number
  tasks_completed: number
  tasks_missed: number
  avg_timeliness_score: number
  assets_by_type: Record<string, { total: number; operational: number; score: number }>
  findings_total: number
  findings_resolved_on_time: number
  expected_scans: number
  actual_valid_scans: number
}

export type ScoreGrade = 'excelente' | 'bueno' | 'regular' | 'deficiente' | 'critico'

export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 90) return 'excelente'
  if (score >= 75) return 'bueno'
  if (score >= 60) return 'regular'
  if (score >= 40) return 'deficiente'
  return 'critico'
}

export interface AssetScoreRecord {
  id: string
  mall_id: string
  asset_type: AssetType
  recorded_date: string
  total_count: number
  operational_count: number
  score_percentage: number
  notes: string | null
  recorded_by: string | null
  created_at: string
}
