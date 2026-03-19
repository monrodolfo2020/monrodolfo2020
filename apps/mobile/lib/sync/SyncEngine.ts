/**
 * SyncEngine — Offline-first sync for Mall Management mobile app
 *
 * Strategy: Delta sync (pull) + upload queue (push)
 * Idempotency: client_id UUID prevents duplicate uploads
 * Conflict resolution: Last-Write-Wins on updated_at; scans/photos are append-only
 */

import NetInfo from '@react-native-community/netinfo'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase/client'
import { getDatabase } from '@/lib/db/schema'

// Tables synced from server → local
const PULL_TABLES = [
  'maintenance_tasks',
  'maintenance_photos',
  'findings',
  'finding_photos',
  'patrol_sessions',
  'checkpoint_scans',
  'security_checkpoints',
  'patrol_routes',
] as const

type SyncStatus = 'idle' | 'syncing' | 'error'

type SyncListener = (status: SyncStatus, progress?: string) => void

class SyncEngine {
  private isOnline = false
  private isSyncing = false
  private listeners: SyncListener[] = []
  private unsubscribeNetInfo: (() => void) | null = null

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  start() {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline
      this.isOnline = !!(state.isConnected && state.isInternetReachable)

      if (wasOffline && this.isOnline) {
        // Just came online: sync immediately
        this.sync().catch(console.error)
      }
    })

    // Check current state
    NetInfo.fetch().then((state) => {
      this.isOnline = !!(state.isConnected && state.isInternetReachable)
      if (this.isOnline) {
        this.sync().catch(console.error)
      }
    })
  }

  stop() {
    this.unsubscribeNetInfo?.()
  }

  addListener(listener: SyncListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private emit(status: SyncStatus, progress?: string) {
    this.listeners.forEach((l) => l(status, progress))
  }

  // ─── Main Sync ─────────────────────────────────────────────────────────────

  async sync() {
    if (this.isSyncing || !this.isOnline) return

    this.isSyncing = true
    this.emit('syncing', 'Iniciando sincronización...')

    try {
      await this.push()
      await this.pull()
      await this.uploadPendingPhotos()
      this.emit('idle')
    } catch (error) {
      console.error('[SyncEngine] Sync failed:', error)
      this.emit('error', 'Error de sincronización')
    } finally {
      this.isSyncing = false
    }
  }

  // ─── Pull (Server → Local) ─────────────────────────────────────────────────

  private async pull() {
    const db = await getDatabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get mall_id from JWT claims
    const { data: { session } } = await supabase.auth.getSession()
    const mallId = (session?.user?.user_metadata?.mall_id ??
      (await this.getMallIdFromProfile(user.id))) as string | null

    if (!mallId) return

    for (const table of PULL_TABLES) {
      this.emit('syncing', `Sincronizando ${table}...`)

      const lastPulledAt = await this.getLastPulledAt(table)

      let query = supabase
        .from(table)
        .select('*')
        .eq('mall_id', mallId)

      if (lastPulledAt) {
        query = query.gt('updated_at', lastPulledAt)
      }

      const { data, error } = await query

      if (error) {
        console.warn(`[SyncEngine] Pull error for ${table}:`, error.message)
        continue
      }

      if (!data || data.length === 0) continue

      // Upsert into local SQLite
      await this.upsertLocalRecords(table, data)

      // Update last pulled timestamp
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (table_name, last_pulled_at)
         VALUES (?, ?)`,
        [table, new Date().toISOString()]
      )
    }
  }

  private async getMallIdFromProfile(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('user_profiles')
      .select('mall_id')
      .eq('id', userId)
      .single()
    return data?.mall_id ?? null
  }

  private async getLastPulledAt(table: string): Promise<string | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ last_pulled_at: string | null }>(
      'SELECT last_pulled_at FROM sync_metadata WHERE table_name = ?',
      [table]
    )
    return row?.last_pulled_at ?? null
  }

  private async upsertLocalRecords(table: string, records: Record<string, unknown>[]) {
    if (records.length === 0) return
    const db = await getDatabase()

    const columns = Object.keys(records[0]!)
    const placeholders = columns.map(() => '?').join(', ')
    const updateClauses = columns
      .filter((c) => c !== 'id')
      .map((c) => `${c} = excluded.${c}`)
      .join(', ')

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updateClauses}
    `

    for (const record of records) {
      const values = columns.map((col) => {
        const v = record[col]
        // Serialize objects/arrays to JSON strings for SQLite
        return v !== null && typeof v === 'object' ? JSON.stringify(v) : v
      })
      await db.runAsync(sql, values as SQLite.SQLiteBindValue[])
    }
  }

  // ─── Push (Local → Server) ─────────────────────────────────────────────────

  private async push() {
    const db = await getDatabase()

    // Push unsynced maintenance tasks
    const unsyncedTasks = await db.getAllAsync<{ id: string }>(
      "SELECT * FROM maintenance_tasks WHERE synced_at IS NULL AND status != 'scheduled'"
    )

    for (const task of unsyncedTasks) {
      await this.pushRecord('maintenance_tasks', task as Record<string, unknown>)
    }

    // Push unsynced checkpoint scans
    const unsyncedScans = await db.getAllAsync(
      'SELECT * FROM checkpoint_scans WHERE synced_at IS NULL'
    )

    for (const scan of unsyncedScans) {
      await this.pushRecord('checkpoint_scans', scan as Record<string, unknown>)
    }

    // Push unsynced patrol sessions
    const unsyncedSessions = await db.getAllAsync(
      "SELECT * FROM patrol_sessions WHERE synced_at IS NULL AND status != 'in_progress'"
    )

    for (const session of unsyncedSessions) {
      await this.pushRecord('patrol_sessions', session as Record<string, unknown>)
    }

    // Push unsynced findings
    const unsyncedFindings = await db.getAllAsync(
      'SELECT * FROM findings WHERE synced_at IS NULL'
    )

    for (const finding of unsyncedFindings) {
      await this.pushRecord('findings', finding as Record<string, unknown>)
    }
  }

  private async pushRecord(table: string, record: Record<string, unknown>) {
    const db = await getDatabase()

    // Parse JSON strings back to objects before sending to server
    const serverRecord = { ...record }
    for (const [key, value] of Object.entries(serverRecord)) {
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          serverRecord[key] = JSON.parse(value)
        } catch {
          // Not valid JSON, keep as string
        }
      }
    }

    const { error } = await supabase
      .from(table)
      .upsert(serverRecord as Parameters<typeof supabase.from>[0] extends never ? never : Record<string, unknown>, {
        onConflict: 'client_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.warn(`[SyncEngine] Push error for ${table} ${record['id']}:`, error.message)
      return
    }

    // Mark as synced locally
    await db.runAsync(
      `UPDATE ${table} SET synced_at = ? WHERE id = ?`,
      [new Date().toISOString(), record['id'] as string]
    )
  }

  // ─── Photo Upload ──────────────────────────────────────────────────────────

  private async uploadPendingPhotos() {
    const db = await getDatabase()

    const pendingPhotos = await db.getAllAsync<{
      id: string
      task_id: string | null
      finding_id: string | null
      local_path: string
      mall_id: string
      client_id: string
    }>(
      `SELECT id, task_id, NULL as finding_id, local_path, mall_id, client_id
       FROM maintenance_photos WHERE upload_status = 'pending' AND local_path IS NOT NULL
       UNION ALL
       SELECT id, NULL as task_id, finding_id, local_path, mall_id, client_id
       FROM finding_photos WHERE upload_status = 'pending' AND local_path IS NOT NULL`
    )

    for (const photo of pendingPhotos) {
      await this.uploadPhoto(photo)
    }
  }

  private async uploadPhoto(photo: {
    id: string
    task_id: string | null
    finding_id: string | null
    local_path: string
    mall_id: string
    client_id: string
  }) {
    const db = await getDatabase()

    // Check file exists
    const fileInfo = await FileSystem.getInfoAsync(photo.local_path)
    if (!fileInfo.exists) {
      // File gone, mark as failed
      const table = photo.task_id ? 'maintenance_photos' : 'finding_photos'
      await db.runAsync(
        `UPDATE ${table} SET upload_status = 'failed' WHERE id = ?`,
        [photo.id]
      )
      return
    }

    const table = photo.task_id ? 'maintenance_photos' : 'finding_photos'
    const subFolder = photo.task_id ? `maintenance/${photo.task_id}` : `findings/${photo.finding_id}`
    const storagePath = `${photo.mall_id}/${subFolder}/photo-${photo.client_id}.jpg`

    // Mark as uploading
    await db.runAsync(
      `UPDATE ${table} SET upload_status = 'uploading' WHERE id = ?`,
      [photo.id]
    )

    try {
      const fileContent = await FileSystem.readAsStringAsync(photo.local_path, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const binaryStr = atob(fileContent)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const { error: uploadError } = await supabase.storage
        .from('mall-media')
        .upload(storagePath, bytes.buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('mall-media')
        .getPublicUrl(storagePath)

      // Update local and remote record with URL
      await db.runAsync(
        `UPDATE ${table} SET upload_status = 'uploaded', photo_url = ?, synced_at = ? WHERE id = ?`,
        [publicUrl, new Date().toISOString(), photo.id]
      )

      // Update remote record
      await supabase
        .from(table)
        .update({ photo_url: publicUrl, upload_status: 'uploaded' })
        .eq('id', photo.id)

      // Delete local file to save space
      await FileSystem.deleteAsync(photo.local_path, { idempotent: true })
    } catch (error) {
      console.warn('[SyncEngine] Photo upload failed:', error)
      await db.runAsync(
        `UPDATE ${table} SET upload_status = 'failed' WHERE id = ?`,
        [photo.id]
      )
    }
  }
}

// Singleton instance
export const syncEngine = new SyncEngine()
