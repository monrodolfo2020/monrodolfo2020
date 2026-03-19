-- ============================================================
-- Migration 005: pg_cron Scheduled Jobs
-- Mall Management SAAS Platform
-- ============================================================
-- Requires: pg_cron extension (available in Supabase Pro)
-- For Supabase Free tier, use Vercel Cron Jobs calling the
-- Edge Functions via HTTP (see vercel.json crons config).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- ─── Job registry table ───────────────────────────────────────────────────────
-- Track cron job execution history for observability

CREATE TABLE IF NOT EXISTS cron_job_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  details     JSONB,
  error       TEXT
);

CREATE INDEX idx_cron_runs_job ON cron_job_runs(job_name, started_at DESC);
CREATE INDEX idx_cron_runs_recent ON cron_job_runs(started_at DESC);

-- Auto-clean old run records (keep 90 days)
SELECT cron.schedule(
  'cleanup-cron-runs',
  '0 3 * * *', -- 03:00 UTC daily
  $$
    DELETE FROM cron_job_runs
    WHERE started_at < NOW() - INTERVAL '90 days';
  $$
);

-- ─── Job 1: generate-daily-tasks ──────────────────────────────────────────────
-- Runs every day at 01:00 UTC (before the workday starts)
-- Calls the Edge Function via pg_net (HTTP)

SELECT cron.schedule(
  'generate-daily-tasks',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/generate-daily-tasks',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 2: calculate-scores (daily) ─────────────────────────────────────────
-- Runs every day at 23:45 UTC to capture the full day

SELECT cron.schedule(
  'calculate-daily-scores',
  '45 23 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/calculate-scores',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{"period_type":"daily"}'::jsonb
  );
  $$
);

-- ─── Job 3: calculate-scores (weekly) ────────────────────────────────────────
-- Runs every Sunday at 23:55 UTC

SELECT cron.schedule(
  'calculate-weekly-scores',
  '55 23 * * 0',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/calculate-scores',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{"period_type":"weekly"}'::jsonb
  );
  $$
);

-- ─── Job 4: calculate-scores (monthly) ───────────────────────────────────────
-- Runs on the last day of the month at 23:58 UTC

SELECT cron.schedule(
  'calculate-monthly-scores',
  '58 23 28-31 * *',
  $$
  DO $$
  BEGIN
    -- Only run on the actual last day of the month
    IF (DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day')::DATE = NOW()::DATE THEN
      PERFORM net.http_post(
        url     := current_setting('app.supabase_url') || '/functions/v1/calculate-scores',
        headers := jsonb_build_object(
          'Content-Type',   'application/json',
          'Authorization',  'Bearer ' || current_setting('app.service_role_key')
        ),
        body    := '{"period_type":"monthly"}'::jsonb
      );
    END IF;
  END;
  $$ LANGUAGE plpgsql;
  $$
);

-- ─── Job 5: process pending CSV imports ───────────────────────────────────────
-- Runs every 5 minutes to pick up newly uploaded CSV files

SELECT cron.schedule(
  'process-csv-imports',
  '*/5 * * * *',
  $$
  DO $$
  DECLARE
    pending_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO pending_count
    FROM inventory_import_jobs
    WHERE status = 'pending';

    IF pending_count > 0 THEN
      PERFORM net.http_post(
        url     := current_setting('app.supabase_url') || '/functions/v1/process-csv-import',
        headers := jsonb_build_object(
          'Content-Type',   'application/json',
          'Authorization',  'Bearer ' || current_setting('app.service_role_key')
        ),
        body    := '{}'::jsonb
      );
    END IF;
  END;
  $$ LANGUAGE plpgsql;
  $$
);

-- ─── Job 6: mark missed patrol sessions ──────────────────────────────────────
-- Runs every hour to flag sessions that never completed

SELECT cron.schedule(
  'mark-missed-patrols',
  '30 * * * *',
  $$
  UPDATE patrol_sessions
  SET status     = 'incomplete',
      updated_at = NOW()
  WHERE status     = 'in_progress'
    AND started_at < NOW() - INTERVAL '4 hours';
  $$
);

-- ─── Job 7: mark missed maintenance tasks ─────────────────────────────────────
-- Runs at 02:00 UTC to flag yesterday's unfinished tasks as missed

SELECT cron.schedule(
  'mark-missed-tasks',
  '0 2 * * *',
  $$
  UPDATE maintenance_tasks
  SET status     = 'missed',
      updated_at = NOW()
  WHERE status        = 'scheduled'
    AND scheduled_date < CURRENT_DATE;
  $$
);

-- ─── Job 8: update last_seen_at staleness ─────────────────────────────────────
-- No-op placeholder; last_seen_at is updated by the Edge Runtime on each request
-- This job cleans up orphan realtime subscriptions after 8 hours of inactivity

SELECT cron.schedule(
  'cleanup-stale-sessions',
  '0 4 * * *',
  $$
  -- Close abandoned patrol sessions older than 12 hours with no scan
  UPDATE patrol_sessions ps
  SET status     = 'abandoned',
      updated_at = NOW()
  FROM (
    SELECT ps2.id
    FROM patrol_sessions ps2
    WHERE ps2.status = 'in_progress'
      AND ps2.started_at < NOW() - INTERVAL '12 hours'
      AND NOT EXISTS (
        SELECT 1 FROM checkpoint_scans cs
        WHERE cs.session_id = ps2.id
          AND cs.scanned_at > NOW() - INTERVAL '12 hours'
      )
  ) stale
  WHERE ps.id = stale.id;
  $$
);

-- ─── Supabase Config Settings for cron ───────────────────────────────────────
-- These must be set via Supabase Dashboard > Settings > Vault / Functions
-- or via the CLI: supabase secrets set APP_SUPABASE_URL=...
--
-- app.supabase_url      => https://<project-ref>.supabase.co
-- app.service_role_key  => <service_role_jwt>
--
-- If pg_net is not available, cron jobs that call Edge Functions
-- will silently fail. Use Vercel Cron Jobs as fallback (see vercel.json).
