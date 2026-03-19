-- ============================================================
-- Migration 001: Initial Schema
-- Mall Management SAAS Platform
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tenants & Users ──────────────────────────────────────────────────────────

CREATE TABLE malls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  address           TEXT,
  city              TEXT,
  country           TEXT NOT NULL DEFAULT 'MX',
  timezone          TEXT NOT NULL DEFAULT 'America/Mexico_City',
  logo_url          TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_plan TEXT NOT NULL DEFAULT 'standard' CHECK (subscription_plan IN ('standard', 'premium')),
  settings          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mall_id       UUID REFERENCES malls(id),
  full_name     TEXT NOT NULL,
  phone         TEXT,
  employee_code TEXT,
  role          TEXT NOT NULL CHECK (role IN (
                  'super_admin', 'mall_admin', 'maintenance_chief',
                  'maintenance_operator', 'security_guard', 'viewer'
                )),
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_mall_id ON user_profiles(mall_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(mall_id, role);

-- ─── Physical Infrastructure ──────────────────────────────────────────────────

CREATE TABLE mall_zones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id         UUID NOT NULL REFERENCES malls(id),
  name            TEXT NOT NULL,
  zone_type       TEXT NOT NULL CHECK (zone_type IN (
                    'parking', 'retail', 'kiosk', 'common_area',
                    'technical', 'admin', 'food_court', 'exterior'
                  )),
  floor_level     INTEGER NOT NULL DEFAULT 0,
  area_sqm        NUMERIC(10,2),
  description     TEXT,
  map_coordinates JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mall_zones_mall ON mall_zones(mall_id);

CREATE TABLE retail_spaces (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id        UUID NOT NULL REFERENCES malls(id),
  zone_id        UUID REFERENCES mall_zones(id),
  space_number   TEXT NOT NULL,
  space_type     TEXT CHECK (space_type IN ('retail', 'island', 'kiosk', 'anchor')),
  area_sqm       NUMERIC(10,2),
  tenant_name    TEXT,
  tenant_contact TEXT,
  is_occupied    BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_rent   NUMERIC(12,2),
  lease_start    DATE,
  lease_end      DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parking_lots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id             UUID NOT NULL REFERENCES malls(id),
  zone_id             UUID REFERENCES mall_zones(id),
  name                TEXT NOT NULL,
  total_spaces        INTEGER NOT NULL,
  accessible_spaces   INTEGER NOT NULL DEFAULT 0,
  ev_charging_spaces  INTEGER NOT NULL DEFAULT 0,
  is_covered          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id        UUID NOT NULL REFERENCES malls(id),
  zone_id        UUID REFERENCES mall_zones(id),
  asset_type     TEXT NOT NULL CHECK (asset_type IN (
                   'luminaire', 'generator', 'electrical_substation',
                   'cctv_camera', 'access_control', 'water_treatment',
                   'drinking_water_plant', 'wifi_access_point',
                   'fire_suppression', 'elevator', 'escalator', 'hvac'
                 )),
  name           TEXT NOT NULL,
  code           TEXT,
  serial_number  TEXT,
  brand          TEXT,
  model          TEXT,
  install_date   DATE,
  warranty_end   DATE,
  status         TEXT NOT NULL DEFAULT 'operational' CHECK (status IN (
                   'operational', 'degraded', 'failed', 'under_maintenance', 'decommissioned'
                 )),
  location_notes TEXT,
  specifications JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_assets_mall_type ON assets(mall_id, asset_type);
CREATE INDEX idx_assets_status ON assets(mall_id, status);

-- ─── Maintenance Module ───────────────────────────────────────────────────────

CREATE TABLE maintenance_activity_types (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id                     UUID NOT NULL REFERENCES malls(id),
  name                        TEXT NOT NULL,
  category                    TEXT NOT NULL CHECK (category IN (
                                'cleaning', 'water', 'electrical', 'security_systems',
                                'networks', 'lighting', 'hvac', 'fire_safety', 'general'
                              )),
  description                 TEXT,
  estimated_duration_minutes  INTEGER NOT NULL DEFAULT 60,
  requires_photos             BOOLEAN NOT NULL DEFAULT TRUE,
  photo_count_required        INTEGER NOT NULL DEFAULT 1,
  scoring_weight              NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  sop_url                     TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_types_mall ON maintenance_activity_types(mall_id, category);

CREATE TABLE maintenance_schedule_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id          UUID NOT NULL REFERENCES malls(id),
  activity_type_id UUID NOT NULL REFERENCES maintenance_activity_types(id),
  frequency        TEXT NOT NULL CHECK (frequency IN (
                     'daily', 'weekly', 'biweekly', 'monthly',
                     'quarterly', 'semiannual', 'annual'
                   )),
  days_of_week     INTEGER[],
  day_of_month     INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  week_numbers     INTEGER[],
  preferred_time   TIME NOT NULL DEFAULT '08:00',
  assigned_role    TEXT NOT NULL DEFAULT 'maintenance_operator',
  zone_id          UUID REFERENCES mall_zones(id),
  asset_id         UUID REFERENCES assets(id),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id          UUID NOT NULL REFERENCES malls(id),
  template_id      UUID REFERENCES maintenance_schedule_templates(id),
  activity_type_id UUID NOT NULL REFERENCES maintenance_activity_types(id),
  zone_id          UUID REFERENCES mall_zones(id),
  asset_id         UUID REFERENCES assets(id),
  title            TEXT NOT NULL,
  description      TEXT,
  scheduled_date   DATE NOT NULL,
  scheduled_time   TIME,
  assigned_to      UUID REFERENCES user_profiles(id),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  validated_at     TIMESTAMPTZ,
  validated_by     UUID REFERENCES user_profiles(id),
  status           TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
                     'scheduled', 'in_progress', 'completed',
                     'validated', 'rejected', 'missed'
                   )),
  rejection_reason TEXT,
  score_earned     NUMERIC(6,2),
  score_possible   NUMERIC(6,2),
  client_id        UUID,
  synced_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_tasks_mall_date ON maintenance_tasks(mall_id, scheduled_date);
CREATE INDEX idx_maintenance_tasks_assigned ON maintenance_tasks(assigned_to, status);
CREATE INDEX idx_maintenance_tasks_status ON maintenance_tasks(mall_id, status);
CREATE INDEX idx_maintenance_tasks_sync ON maintenance_tasks(mall_id, updated_at);

CREATE TABLE maintenance_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id         UUID NOT NULL REFERENCES malls(id),
  task_id         UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  caption         TEXT,
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  taken_by        UUID REFERENCES user_profiles(id),
  geolocation     JSONB,
  file_size_bytes INTEGER,
  client_id       UUID,
  local_path      TEXT,
  upload_status   TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN (
                    'pending', 'uploading', 'uploaded', 'failed'
                  )),
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_photos_task ON maintenance_photos(task_id);

CREATE TABLE findings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id          UUID NOT NULL REFERENCES malls(id),
  task_id          UUID REFERENCES maintenance_tasks(id),
  zone_id          UUID REFERENCES mall_zones(id),
  asset_id         UUID REFERENCES assets(id),
  reported_by      UUID NOT NULL REFERENCES user_profiles(id),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  severity         TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN (
                     'low', 'medium', 'high', 'critical'
                   )),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                     'open', 'in_progress', 'resolved', 'dismissed'
                   )),
  resolution_date  DATE,
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID REFERENCES user_profiles(id),
  resolution_notes TEXT,
  affects_score    BOOLEAN NOT NULL DEFAULT TRUE,
  score_deduction  NUMERIC(5,2) NOT NULL DEFAULT 0,
  client_id        UUID,
  synced_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_mall_status ON findings(mall_id, status);
CREATE INDEX idx_findings_sync ON findings(mall_id, updated_at);

CREATE TABLE finding_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id       UUID NOT NULL REFERENCES malls(id),
  finding_id    UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  caption       TEXT,
  taken_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  taken_by      UUID REFERENCES user_profiles(id),
  geolocation   JSONB,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  client_id     UUID,
  synced_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Security Module ──────────────────────────────────────────────────────────

CREATE TABLE security_checkpoints (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id                UUID NOT NULL REFERENCES malls(id),
  zone_id                UUID REFERENCES mall_zones(id),
  name                   TEXT NOT NULL,
  location_notes         TEXT,
  qr_code                TEXT UNIQUE NOT NULL,
  qr_secret              TEXT NOT NULL,
  geolocation            JSONB,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 50,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_mall ON security_checkpoints(mall_id, is_active);

CREATE TABLE patrol_routes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id                     UUID NOT NULL REFERENCES malls(id),
  name                        TEXT NOT NULL,
  description                 TEXT,
  checkpoint_sequence         UUID[] NOT NULL DEFAULT '{}',
  expected_duration_minutes   INTEGER,
  schedule_type               TEXT CHECK (schedule_type IN ('fixed', 'interval', 'random')),
  scheduled_times             TIME[],
  interval_minutes            INTEGER,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patrol_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id               UUID NOT NULL REFERENCES malls(id),
  route_id              UUID NOT NULL REFERENCES patrol_routes(id),
  guard_id              UUID NOT NULL REFERENCES user_profiles(id),
  started_at            TIMESTAMPTZ NOT NULL,
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
                          'in_progress', 'completed', 'incomplete', 'abandoned'
                        )),
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes                 TEXT,
  client_id             UUID,
  synced_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patrol_sessions_mall ON patrol_sessions(mall_id, started_at DESC);
CREATE INDEX idx_patrol_sessions_guard ON patrol_sessions(guard_id, started_at DESC);

CREATE TABLE checkpoint_scans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id            UUID NOT NULL REFERENCES malls(id),
  session_id         UUID NOT NULL REFERENCES patrol_sessions(id),
  checkpoint_id      UUID NOT NULL REFERENCES security_checkpoints(id),
  guard_id           UUID NOT NULL REFERENCES user_profiles(id),
  scanned_at         TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_payload         TEXT NOT NULL,
  qr_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  geolocation        JSONB NOT NULL,
  geolocation_valid  BOOLEAN NOT NULL DEFAULT FALSE,
  device_info        JSONB,
  client_id          UUID UNIQUE,
  synced_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkpoint_scans_mall_date ON checkpoint_scans(mall_id, scanned_at DESC);
CREATE INDEX idx_checkpoint_scans_session ON checkpoint_scans(session_id);
CREATE INDEX idx_checkpoint_scans_guard ON checkpoint_scans(guard_id, scanned_at DESC);

CREATE TABLE security_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id       UUID NOT NULL REFERENCES malls(id),
  session_id    UUID REFERENCES patrol_sessions(id),
  reported_by   UUID NOT NULL REFERENCES user_profiles(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
                  'theft', 'vandalism', 'medical', 'fire',
                  'unauthorized_access', 'suspicious_activity', 'other'
                )),
  description   TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'medium',
  geolocation   JSONB,
  status        TEXT NOT NULL DEFAULT 'open',
  client_id     UUID,
  synced_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Inventory Module ─────────────────────────────────────────────────────────

CREATE TABLE inventory_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id          UUID NOT NULL REFERENCES malls(id),
  sku              TEXT,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN (
                     'lighting', 'electrical', 'plumbing', 'cleaning_supplies',
                     'hardware', 'fuel', 'safety', 'paint', 'hvac', 'other'
                   )),
  unit_of_measure  TEXT NOT NULL DEFAULT 'piece',
  unit_cost        NUMERIC(10,2),
  minimum_stock    INTEGER NOT NULL DEFAULT 0,
  current_stock    INTEGER NOT NULL DEFAULT 0,
  maximum_stock    INTEGER,
  location_notes   TEXT,
  supplier_name    TEXT,
  supplier_contact TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_mall ON inventory_items(mall_id, category);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(mall_id)
  WHERE current_stock <= minimum_stock AND is_active = TRUE;

CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id         UUID NOT NULL REFERENCES malls(id),
  item_id         UUID NOT NULL REFERENCES inventory_items(id),
  movement_type   TEXT NOT NULL CHECK (movement_type IN (
                    'initial_load', 'purchase', 'consumption',
                    'adjustment', 'return', 'waste'
                  )),
  quantity        INTEGER NOT NULL CHECK (quantity != 0),
  unit_cost       NUMERIC(10,2),
  stock_before    INTEGER,
  stock_after     INTEGER,
  task_id         UUID REFERENCES maintenance_tasks(id),
  performed_by    UUID REFERENCES user_profiles(id),
  notes           TEXT,
  reference_doc   TEXT,
  movement_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id       UUID,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, movement_date DESC);
CREATE INDEX idx_stock_movements_mall ON stock_movements(mall_id, movement_date DESC);

CREATE TABLE inventory_import_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id        UUID NOT NULL REFERENCES malls(id),
  file_url       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                   'pending', 'processing', 'completed', 'failed'
                 )),
  total_rows     INTEGER,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  error_rows     INTEGER NOT NULL DEFAULT 0,
  errors         JSONB,
  imported_by    UUID REFERENCES user_profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ─── Scoring System ───────────────────────────────────────────────────────────

CREATE TABLE scoring_config (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id                         UUID NOT NULL REFERENCES malls(id) UNIQUE,
  weight_maintenance_completion   NUMERIC(5,2) NOT NULL DEFAULT 30,
  weight_maintenance_timeliness   NUMERIC(5,2) NOT NULL DEFAULT 20,
  weight_asset_status             NUMERIC(5,2) NOT NULL DEFAULT 25,
  weight_findings_resolution      NUMERIC(5,2) NOT NULL DEFAULT 15,
  weight_security_compliance      NUMERIC(5,2) NOT NULL DEFAULT 10,
  on_time_bonus_hours             INTEGER NOT NULL DEFAULT 0,
  late_penalty_per_hour           NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  max_late_penalty                NUMERIC(5,2) NOT NULL DEFAULT 50,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weights_sum_100 CHECK (
    weight_maintenance_completion + weight_maintenance_timeliness +
    weight_asset_status + weight_findings_resolution + weight_security_compliance = 100
  )
);

CREATE TABLE score_snapshots (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id                         UUID NOT NULL REFERENCES malls(id),
  period_type                     TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start                    DATE NOT NULL,
  period_end                      DATE NOT NULL,
  score_maintenance_completion    NUMERIC(6,2),
  score_maintenance_timeliness    NUMERIC(6,2),
  score_asset_status              NUMERIC(6,2),
  score_findings_resolution       NUMERIC(6,2),
  score_security_compliance       NUMERIC(6,2),
  total_score                     NUMERIC(6,2),
  metadata                        JSONB,
  calculated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_score_snapshots_period
  ON score_snapshots(mall_id, period_type, period_start);
CREATE INDEX idx_score_snapshots_mall
  ON score_snapshots(mall_id, period_end DESC);

CREATE TABLE asset_score_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id           UUID NOT NULL REFERENCES malls(id),
  asset_type        TEXT NOT NULL,
  recorded_date     DATE NOT NULL,
  total_count       INTEGER NOT NULL CHECK (total_count > 0),
  operational_count INTEGER NOT NULL CHECK (operational_count >= 0),
  score_percentage  NUMERIC(5,2) GENERATED ALWAYS AS (
                      ROUND((operational_count::NUMERIC / total_count) * 100, 2)
                    ) STORED,
  notes             TEXT,
  recorded_by       UUID REFERENCES user_profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT operational_lte_total CHECK (operational_count <= total_count)
);

CREATE INDEX idx_asset_score_records_mall ON asset_score_records(mall_id, recorded_date DESC);

-- ─── Updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'malls', 'user_profiles', 'mall_zones', 'retail_spaces', 'parking_lots',
    'assets', 'maintenance_activity_types', 'maintenance_schedule_templates',
    'maintenance_tasks', 'findings', 'security_checkpoints', 'patrol_routes',
    'patrol_sessions', 'security_incidents', 'inventory_items', 'scoring_config'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at_%s
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
