-- ============================================================
-- Migration 006: RPC Functions & Utility Procedures
-- Mall Management SAAS Platform
-- ============================================================

-- ─── count_expected_scans ─────────────────────────────────────────────────────
-- Used by calculate-scores Edge Function to determine security compliance.
-- Returns the number of checkpoint scans expected for a mall in a date range,
-- based on active patrol routes and their schedules.

CREATE OR REPLACE FUNCTION count_expected_scans(
  p_mall_id    UUID,
  p_date_start DATE,
  p_date_end   DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_total         INTEGER := 0;
  v_route         RECORD;
  v_days          INTEGER;
  v_checkpoints   INTEGER;
  v_daily_runs    NUMERIC;
BEGIN
  v_days := (p_date_end - p_date_start) + 1;

  FOR v_route IN
    SELECT
      pr.id,
      pr.schedule_type,
      pr.scheduled_times,
      pr.interval_minutes,
      array_length(pr.checkpoint_sequence, 1) AS checkpoint_count
    FROM patrol_routes pr
    WHERE pr.mall_id   = p_mall_id
      AND pr.is_active = TRUE
  LOOP
    v_checkpoints := COALESCE(v_route.checkpoint_count, 0);

    CASE v_route.schedule_type
      WHEN 'fixed' THEN
        -- Number of fixed times per day × days in period × checkpoints
        v_daily_runs := COALESCE(array_length(v_route.scheduled_times, 1), 1);

      WHEN 'interval' THEN
        -- 24-hour coverage divided by interval
        IF v_route.interval_minutes IS NOT NULL AND v_route.interval_minutes > 0 THEN
          v_daily_runs := FLOOR(1440.0 / v_route.interval_minutes);
        ELSE
          v_daily_runs := 1;
        END IF;

      WHEN 'random' THEN
        -- Assume minimum 2 random patrols per day
        v_daily_runs := 2;

      ELSE
        v_daily_runs := 1;
    END CASE;

    v_total := v_total + (v_days * v_daily_runs * v_checkpoints)::INTEGER;
  END LOOP;

  RETURN v_total;
END;
$$;

-- ─── get_mall_dashboard_summary ──────────────────────────────────────────────
-- Returns a single-row summary for the Overview dashboard widget.
-- Avoids N+1 queries from the frontend.

CREATE OR REPLACE FUNCTION get_mall_dashboard_summary(p_mall_id UUID)
RETURNS TABLE (
  open_findings          BIGINT,
  critical_findings      BIGINT,
  tasks_today_total      BIGINT,
  tasks_today_completed  BIGINT,
  tasks_today_missed     BIGINT,
  active_patrols         BIGINT,
  low_stock_items        BIGINT,
  last_score             NUMERIC,
  last_score_date        DATE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM findings     WHERE mall_id = p_mall_id AND status = 'open')::BIGINT,
    (SELECT COUNT(*) FROM findings     WHERE mall_id = p_mall_id AND status = 'open' AND severity = 'critical')::BIGINT,
    (SELECT COUNT(*) FROM maintenance_tasks WHERE mall_id = p_mall_id AND scheduled_date = CURRENT_DATE)::BIGINT,
    (SELECT COUNT(*) FROM maintenance_tasks WHERE mall_id = p_mall_id AND scheduled_date = CURRENT_DATE AND status IN ('completed','validated'))::BIGINT,
    (SELECT COUNT(*) FROM maintenance_tasks WHERE mall_id = p_mall_id AND scheduled_date = CURRENT_DATE AND status = 'missed')::BIGINT,
    (SELECT COUNT(*) FROM patrol_sessions WHERE mall_id = p_mall_id AND status = 'in_progress')::BIGINT,
    (SELECT COUNT(*) FROM inventory_items  WHERE mall_id = p_mall_id AND is_active = TRUE AND current_stock <= minimum_stock)::BIGINT,
    (SELECT total_score  FROM score_snapshots WHERE mall_id = p_mall_id AND period_type = 'daily' ORDER BY period_end DESC LIMIT 1),
    (SELECT period_end   FROM score_snapshots WHERE mall_id = p_mall_id AND period_type = 'daily' ORDER BY period_end DESC LIMIT 1)
  ;
$$;

-- ─── get_score_trend ─────────────────────────────────────────────────────────
-- Returns N most recent daily scores for charting.

CREATE OR REPLACE FUNCTION get_score_trend(
  p_mall_id UUID,
  p_days    INTEGER DEFAULT 30
)
RETURNS TABLE (
  period_end  DATE,
  total_score NUMERIC,
  maintenance NUMERIC,
  security    NUMERIC,
  assets      NUMERIC,
  findings    NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    period_end,
    total_score,
    score_maintenance_completion + score_maintenance_timeliness AS maintenance,
    score_security_compliance                                    AS security,
    score_asset_status                                           AS assets,
    score_findings_resolution                                    AS findings
  FROM score_snapshots
  WHERE mall_id     = p_mall_id
    AND period_type = 'daily'
    AND period_end >= CURRENT_DATE - p_days
  ORDER BY period_end ASC;
$$;

-- ─── sync_pull ────────────────────────────────────────────────────────────────
-- Mobile offline sync: returns all records modified after a given timestamp.
-- Returns a unified changeset that the mobile app can apply locally.

CREATE OR REPLACE FUNCTION sync_pull(
  p_mall_id      UUID,
  p_last_pull_at TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'pulled_at', NOW(),
    'maintenance_tasks',
      (SELECT json_agg(t) FROM (
        SELECT * FROM maintenance_tasks
        WHERE mall_id   = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
        LIMIT 500
      ) t),
    'findings',
      (SELECT json_agg(f) FROM (
        SELECT * FROM findings
        WHERE mall_id    = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
        LIMIT 200
      ) f),
    'patrol_sessions',
      (SELECT json_agg(ps) FROM (
        SELECT * FROM patrol_sessions
        WHERE mall_id    = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
        LIMIT 200
      ) ps),
    'checkpoint_scans',
      (SELECT json_agg(cs) FROM (
        SELECT * FROM checkpoint_scans
        WHERE mall_id    = p_mall_id
          AND created_at > p_last_pull_at
        ORDER BY created_at
        LIMIT 500
      ) cs),
    'inventory_items',
      (SELECT json_agg(i) FROM (
        SELECT id, mall_id, sku, name, category, unit_of_measure,
               current_stock, minimum_stock, is_active, updated_at
        FROM inventory_items
        WHERE mall_id    = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
        LIMIT 500
      ) i),
    'security_checkpoints',
      (SELECT json_agg(sc) FROM (
        SELECT id, mall_id, zone_id, name, location_notes,
               qr_code, geolocation, geofence_radius_meters, is_active
        FROM security_checkpoints
        WHERE mall_id    = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
      ) sc),
    'patrol_routes',
      (SELECT json_agg(pr) FROM (
        SELECT * FROM patrol_routes
        WHERE mall_id    = p_mall_id
          AND updated_at > p_last_pull_at
        ORDER BY updated_at
      ) pr)
  );
END;
$$;

-- ─── sync_push ────────────────────────────────────────────────────────────────
-- Mobile offline sync: accepts a batch of changes from the mobile device
-- and upserts them into the database, deduplicating by client_id.

CREATE OR REPLACE FUNCTION sync_push(p_payload JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasks         JSON;
  v_findings      JSON;
  v_sessions      JSON;
  v_scans         JSON;
  v_movements     JSON;
  v_tasks_count   INTEGER := 0;
  v_other_count   INTEGER := 0;
BEGIN
  v_tasks    := p_payload -> 'maintenance_tasks';
  v_findings := p_payload -> 'findings';
  v_sessions := p_payload -> 'patrol_sessions';
  v_scans    := p_payload -> 'checkpoint_scans';
  v_movements:= p_payload -> 'stock_movements';

  -- Upsert maintenance_tasks
  IF v_tasks IS NOT NULL THEN
    WITH rows AS (SELECT * FROM json_populate_recordset(NULL::maintenance_tasks, v_tasks))
    INSERT INTO maintenance_tasks
      SELECT * FROM rows
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO UPDATE
      SET status        = EXCLUDED.status,
          started_at    = EXCLUDED.started_at,
          completed_at  = EXCLUDED.completed_at,
          score_earned  = EXCLUDED.score_earned,
          synced_at     = NOW(),
          updated_at    = NOW();
    GET DIAGNOSTICS v_tasks_count = ROW_COUNT;
  END IF;

  -- Upsert findings
  IF v_findings IS NOT NULL THEN
    WITH rows AS (SELECT * FROM json_populate_recordset(NULL::findings, v_findings))
    INSERT INTO findings
      SELECT * FROM rows
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO UPDATE
      SET status           = EXCLUDED.status,
          resolved_at      = EXCLUDED.resolved_at,
          resolution_notes = EXCLUDED.resolution_notes,
          synced_at        = NOW(),
          updated_at       = NOW();
    GET DIAGNOSTICS v_other_count = ROW_COUNT;
  END IF;

  -- Upsert patrol_sessions
  IF v_sessions IS NOT NULL THEN
    WITH rows AS (SELECT * FROM json_populate_recordset(NULL::patrol_sessions, v_sessions))
    INSERT INTO patrol_sessions
      SELECT * FROM rows
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO UPDATE
      SET status                = EXCLUDED.status,
          completed_at          = EXCLUDED.completed_at,
          completion_percentage = EXCLUDED.completion_percentage,
          synced_at             = NOW(),
          updated_at            = NOW();
  END IF;

  -- Upsert checkpoint_scans (immutable once created)
  IF v_scans IS NOT NULL THEN
    WITH rows AS (SELECT * FROM json_populate_recordset(NULL::checkpoint_scans, v_scans))
    INSERT INTO checkpoint_scans
      SELECT * FROM rows
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO NOTHING;
  END IF;

  -- Upsert stock_movements (immutable)
  IF v_movements IS NOT NULL THEN
    WITH rows AS (SELECT * FROM json_populate_recordset(NULL::stock_movements, v_movements))
    INSERT INTO stock_movements
      SELECT * FROM rows
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO NOTHING;
  END IF;

  RETURN json_build_object(
    'success',      TRUE,
    'synced_at',    NOW(),
    'tasks_pushed', v_tasks_count
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error',   SQLERRM
  );
END;
$$;

-- ─── get_low_stock_alert ──────────────────────────────────────────────────────
-- Returns items at or below minimum stock, enriched for dashboard alerts.

CREATE OR REPLACE FUNCTION get_low_stock_alert(p_mall_id UUID)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  category        TEXT,
  current_stock   INTEGER,
  minimum_stock   INTEGER,
  unit_of_measure TEXT,
  deficit         INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    id,
    name,
    category,
    current_stock,
    minimum_stock,
    unit_of_measure,
    minimum_stock - current_stock AS deficit
  FROM inventory_items
  WHERE mall_id     = p_mall_id
    AND is_active   = TRUE
    AND current_stock <= minimum_stock
  ORDER BY (minimum_stock - current_stock) DESC, name;
$$;

-- ─── get_findings_open_by_severity ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_findings_open_by_severity(p_mall_id UUID)
RETURNS TABLE (severity TEXT, count BIGINT, oldest_days INTEGER)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    severity,
    COUNT(*)                                                             AS count,
    EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER                  AS oldest_days
  FROM findings
  WHERE mall_id = p_mall_id
    AND status  = 'open'
  GROUP BY severity
  ORDER BY ARRAY_POSITION(ARRAY['critical','high','medium','low'], severity);
$$;

-- ─── get_patrol_compliance_today ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_patrol_compliance_today(p_mall_id UUID)
RETURNS TABLE (
  route_id   UUID,
  route_name TEXT,
  expected   INTEGER,
  completed  INTEGER,
  compliance NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH expected AS (
    SELECT
      pr.id                                                AS route_id,
      pr.name                                              AS route_name,
      CASE pr.schedule_type
        WHEN 'fixed'    THEN COALESCE(array_length(pr.scheduled_times, 1), 1)
        WHEN 'interval' THEN FLOOR(1440.0 / COALESCE(pr.interval_minutes, 120))::INTEGER
        ELSE 2
      END AS expected_count
    FROM patrol_routes pr
    WHERE pr.mall_id   = p_mall_id
      AND pr.is_active = TRUE
  ),
  done AS (
    SELECT
      route_id,
      COUNT(*) AS completed_count
    FROM patrol_sessions
    WHERE mall_id      = p_mall_id
      AND status       = 'completed'
      AND DATE(started_at AT TIME ZONE 'UTC') = CURRENT_DATE
    GROUP BY route_id
  )
  SELECT
    e.route_id,
    e.route_name,
    e.expected_count,
    COALESCE(d.completed_count, 0)::INTEGER,
    ROUND(LEAST(COALESCE(d.completed_count, 0)::NUMERIC / NULLIF(e.expected_count, 0) * 100, 100), 2)
  FROM expected e
  LEFT JOIN done d ON d.route_id = e.route_id;
$$;

-- ─── Grant EXECUTE to authenticated users (RLS enforces row-level access) ─────

GRANT EXECUTE ON FUNCTION count_expected_scans         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_mall_dashboard_summary   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_score_trend              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_pull                    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_push                    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_low_stock_alert          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_findings_open_by_severity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_patrol_compliance_today  TO authenticated, service_role;
