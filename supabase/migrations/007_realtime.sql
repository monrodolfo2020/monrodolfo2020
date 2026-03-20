-- ============================================================
-- Migration 007: Supabase Realtime Publication
-- Mall Management SAAS Platform
-- ============================================================
-- Enables Postgres Changes for the tables that need live updates
-- in the web dashboard and mobile app.
-- ============================================================

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE
  patrol_sessions,
  checkpoint_scans,
  maintenance_tasks,
  findings,
  inventory_items,
  score_snapshots;

-- NOTE: security_checkpoints is NOT added to realtime because QR secrets
-- should not be broadcast to all connected clients. The mobile app fetches
-- checkpoints during sync_pull instead.
-- Deployment triggered 2026-03-20T01:07:01Z
