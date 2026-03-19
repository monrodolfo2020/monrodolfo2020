import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('mall_management.db', {
      useNewConnection: false,
    })
    await initializeSchema(db)
  }
  return db
}

async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;')
  await db.execAsync('PRAGMA foreign_keys = ON;')

  await db.execAsync(`
    -- Sync metadata: tracks last pull/push timestamps per table
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name     TEXT PRIMARY KEY,
      last_pulled_at TEXT,
      last_pushed_at TEXT
    );

    -- Local mirror of maintenance_tasks
    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id                UUID PRIMARY KEY,
      mall_id           TEXT NOT NULL,
      template_id       TEXT,
      activity_type_id  TEXT NOT NULL,
      zone_id           TEXT,
      asset_id          TEXT,
      title             TEXT NOT NULL,
      description       TEXT,
      scheduled_date    TEXT NOT NULL,
      scheduled_time    TEXT,
      assigned_to       TEXT,
      started_at        TEXT,
      completed_at      TEXT,
      validated_at      TEXT,
      validated_by      TEXT,
      status            TEXT NOT NULL DEFAULT 'scheduled',
      rejection_reason  TEXT,
      score_earned      REAL,
      score_possible    REAL,
      client_id         TEXT,
      synced_at         TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    );

    -- Local mirror of maintenance_photos
    CREATE TABLE IF NOT EXISTS maintenance_photos (
      id              TEXT PRIMARY KEY,
      mall_id         TEXT NOT NULL,
      task_id         TEXT NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
      photo_url       TEXT,
      thumbnail_url   TEXT,
      caption         TEXT,
      taken_at        TEXT NOT NULL,
      taken_by        TEXT,
      geolocation     TEXT,       -- JSON string
      file_size_bytes INTEGER,
      client_id       TEXT,
      local_path      TEXT,       -- Filesystem path before upload
      upload_status   TEXT NOT NULL DEFAULT 'pending',
      synced_at       TEXT,
      created_at      TEXT NOT NULL
    );

    -- Local mirror of findings
    CREATE TABLE IF NOT EXISTS findings (
      id               TEXT PRIMARY KEY,
      mall_id          TEXT NOT NULL,
      task_id          TEXT,
      zone_id          TEXT,
      asset_id         TEXT,
      reported_by      TEXT NOT NULL,
      title            TEXT NOT NULL,
      description      TEXT NOT NULL,
      severity         TEXT NOT NULL DEFAULT 'medium',
      status           TEXT NOT NULL DEFAULT 'open',
      resolution_date  TEXT,
      resolved_at      TEXT,
      resolved_by      TEXT,
      resolution_notes TEXT,
      affects_score    INTEGER NOT NULL DEFAULT 1,
      score_deduction  REAL NOT NULL DEFAULT 0,
      client_id        TEXT,
      synced_at        TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );

    -- Local mirror of finding_photos (same pattern as maintenance_photos)
    CREATE TABLE IF NOT EXISTS finding_photos (
      id            TEXT PRIMARY KEY,
      mall_id       TEXT NOT NULL,
      finding_id    TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
      photo_url     TEXT,
      thumbnail_url TEXT,
      caption       TEXT,
      taken_at      TEXT NOT NULL,
      taken_by      TEXT,
      geolocation   TEXT,
      upload_status TEXT NOT NULL DEFAULT 'pending',
      client_id     TEXT,
      synced_at     TEXT,
      created_at    TEXT NOT NULL
    );

    -- Local mirror of patrol_sessions
    CREATE TABLE IF NOT EXISTS patrol_sessions (
      id                    TEXT PRIMARY KEY,
      mall_id               TEXT NOT NULL,
      route_id              TEXT NOT NULL,
      guard_id              TEXT NOT NULL,
      started_at            TEXT NOT NULL,
      completed_at          TEXT,
      status                TEXT NOT NULL DEFAULT 'in_progress',
      completion_percentage REAL NOT NULL DEFAULT 0,
      notes                 TEXT,
      client_id             TEXT,
      synced_at             TEXT,
      created_at            TEXT NOT NULL,
      updated_at            TEXT NOT NULL
    );

    -- Local mirror of checkpoint_scans
    CREATE TABLE IF NOT EXISTS checkpoint_scans (
      id                TEXT PRIMARY KEY,
      mall_id           TEXT NOT NULL,
      session_id        TEXT NOT NULL REFERENCES patrol_sessions(id),
      checkpoint_id     TEXT NOT NULL,
      guard_id          TEXT NOT NULL,
      scanned_at        TEXT NOT NULL,
      qr_payload        TEXT NOT NULL,
      qr_verified       INTEGER NOT NULL DEFAULT 0,
      geolocation       TEXT NOT NULL,   -- JSON string
      geolocation_valid INTEGER NOT NULL DEFAULT 0,
      device_info       TEXT,
      client_id         TEXT UNIQUE,
      synced_at         TEXT,
      created_at        TEXT NOT NULL
    );

    -- Cached reference data (read-only, pulled from server)
    CREATE TABLE IF NOT EXISTS security_checkpoints (
      id                     TEXT PRIMARY KEY,
      mall_id                TEXT NOT NULL,
      zone_id                TEXT,
      name                   TEXT NOT NULL,
      location_notes         TEXT,
      qr_code                TEXT NOT NULL,
      geolocation            TEXT,
      geofence_radius_meters INTEGER NOT NULL DEFAULT 50,
      is_active              INTEGER NOT NULL DEFAULT 1,
      updated_at             TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patrol_routes (
      id                          TEXT PRIMARY KEY,
      mall_id                     TEXT NOT NULL,
      name                        TEXT NOT NULL,
      description                 TEXT,
      checkpoint_sequence         TEXT NOT NULL DEFAULT '[]',   -- JSON array
      expected_duration_minutes   INTEGER,
      is_active                   INTEGER NOT NULL DEFAULT 1,
      updated_at                  TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON maintenance_tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_unsynced ON maintenance_tasks(synced_at) WHERE synced_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_photos_unsynced ON maintenance_photos(upload_status) WHERE upload_status != 'uploaded';
    CREATE INDEX IF NOT EXISTS idx_scans_unsynced ON checkpoint_scans(synced_at) WHERE synced_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_findings_unsynced ON findings(synced_at) WHERE synced_at IS NULL;
  `)
}
