import type { MaintenanceTask, PatrolSession, ScoreSnapshot } from './entities'

// ─── Generic API Response ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
}

// ─── Edge Function Payloads ───────────────────────────────────────────────────

export interface GenerateQRRequest {
  checkpoint_id: string
}

export interface GenerateQRResponse {
  qr_payload: string
  qr_data_url: string // base64 PNG
}

export interface VerifyScanRequest {
  scan_id: string
  qr_payload: string
  geolocation: {
    lat: number
    lng: number
    accuracy: number
  }
}

export interface VerifyScanResponse {
  qr_verified: boolean
  geolocation_valid: boolean
  distance_meters: number
}

export interface CalculateScoresRequest {
  mall_id: string
  period_type: 'daily' | 'weekly' | 'monthly'
  period_start: string
  period_end: string
}

export interface CalculateScoresResponse {
  snapshot: ScoreSnapshot
}

export interface GenerateDailyTasksRequest {
  mall_id?: string // If omitted, generates for all malls
  date?: string    // If omitted, uses tomorrow
}

export interface GenerateDailyTasksResponse {
  tasks_created: number
  malls_processed: number
}

export interface ProcessCSVImportRequest {
  import_job_id: string
}

export interface ProcessCSVImportResponse {
  processed_rows: number
  error_rows: number
  errors: Array<{ row: number; error: string }>
}

// ─── Sync Payloads (Mobile → Server) ─────────────────────────────────────────

export interface SyncUploadPayload {
  tasks: Partial<MaintenanceTask>[]
  patrol_sessions: Partial<PatrolSession>[]
  checkpoint_scans: Array<{
    client_id: string
    session_id: string
    checkpoint_id: string
    guard_id: string
    scanned_at: string
    qr_payload: string
    geolocation: { lat: number; lng: number; accuracy: number }
    device_info?: Record<string, unknown>
  }>
}

export interface SyncDeltaRequest {
  mall_id: string
  tables: Array<{
    table: string
    last_pulled_at: string
  }>
}

export interface SyncDeltaResponse {
  tables: Record<string, unknown[]>
  server_time: string
}
