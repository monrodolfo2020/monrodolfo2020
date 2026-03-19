-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- ─── Helper Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auth_user_mall_id()
RETURNS UUID AS $$
  SELECT mall_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE malls                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_zones                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_spaces                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_lots                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_activity_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_photos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_checkpoints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_routes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_scans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_import_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_config                ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots               ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_score_records           ENABLE ROW LEVEL SECURITY;

-- ─── Malls ────────────────────────────────────────────────────────────────────

CREATE POLICY "Super admins see all malls"
  ON malls FOR SELECT
  USING (public.auth_user_role() = 'super_admin');

CREATE POLICY "Users see own mall"
  ON malls FOR SELECT
  USING (id = public.auth_user_mall_id());

CREATE POLICY "Super admins manage malls"
  ON malls FOR ALL
  USING (public.auth_user_role() = 'super_admin');

-- ─── User Profiles ────────────────────────────────────────────────────────────

CREATE POLICY "Users see own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users see profiles in own mall"
  ON user_profiles FOR SELECT
  USING (mall_id = public.auth_user_mall_id());

CREATE POLICY "Super admins see all profiles"
  ON user_profiles FOR SELECT
  USING (public.auth_user_role() = 'super_admin');

CREATE POLICY "Admins manage mall users"
  ON user_profiles FOR ALL
  USING (
    public.auth_user_role() IN ('super_admin', 'mall_admin')
    AND (mall_id = public.auth_user_mall_id() OR public.auth_user_role() = 'super_admin')
  );

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- ─── Reusable: tenant-scoped SELECT/INSERT/UPDATE/DELETE ─────────────────────

-- For each mall-scoped table, staff can read within their mall, admins/chiefs can write.

-- Mall Zones
CREATE POLICY "Staff read own mall zones"
  ON mall_zones FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage zones"
  ON mall_zones FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin') AND
         (mall_id = public.auth_user_mall_id() OR public.auth_user_role() = 'super_admin'));

-- Retail Spaces
CREATE POLICY "Staff read own mall retail spaces"
  ON retail_spaces FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage retail spaces"
  ON retail_spaces FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

-- Parking
CREATE POLICY "Staff read own mall parking"
  ON parking_lots FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage parking"
  ON parking_lots FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

-- Assets
CREATE POLICY "Staff read own mall assets"
  ON assets FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins and chiefs manage assets"
  ON assets FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin', 'maintenance_chief'));

-- ─── Maintenance ──────────────────────────────────────────────────────────────

CREATE POLICY "Staff read activity types"
  ON maintenance_activity_types FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage activity types"
  ON maintenance_activity_types FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin', 'maintenance_chief'));

CREATE POLICY "Staff read schedule templates"
  ON maintenance_schedule_templates FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Chiefs manage schedule templates"
  ON maintenance_schedule_templates FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin', 'maintenance_chief'));

-- Maintenance Tasks: all mall staff can read, operators can insert/update own tasks
CREATE POLICY "Staff see own mall tasks"
  ON maintenance_tasks FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Operators create tasks"
  ON maintenance_tasks FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN (
      'maintenance_chief', 'maintenance_operator', 'mall_admin', 'super_admin'
    )
  );

CREATE POLICY "Operators update own tasks, chiefs update all"
  ON maintenance_tasks FOR UPDATE
  USING (
    mall_id = public.auth_user_mall_id()
    AND (
      (public.auth_user_role() = 'maintenance_operator' AND assigned_to = auth.uid())
      OR public.auth_user_role() IN ('maintenance_chief', 'mall_admin', 'super_admin')
    )
  );

-- Maintenance Photos
CREATE POLICY "Staff read maintenance photos"
  ON maintenance_photos FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Operators upload photos"
  ON maintenance_photos FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN (
      'maintenance_chief', 'maintenance_operator', 'mall_admin', 'super_admin'
    )
  );

-- Findings
CREATE POLICY "Staff read findings"
  ON findings FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Staff create findings"
  ON findings FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN (
      'maintenance_chief', 'maintenance_operator', 'security_guard', 'mall_admin', 'super_admin'
    )
  );

CREATE POLICY "Chiefs resolve findings"
  ON findings FOR UPDATE
  USING (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN ('maintenance_chief', 'mall_admin', 'super_admin')
  );

-- Finding Photos
CREATE POLICY "Staff read finding photos"
  ON finding_photos FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Staff upload finding photos"
  ON finding_photos FOR INSERT
  WITH CHECK (mall_id = public.auth_user_mall_id());

-- ─── Security Module ──────────────────────────────────────────────────────────

CREATE POLICY "Staff read checkpoints"
  ON security_checkpoints FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage checkpoints"
  ON security_checkpoints FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

CREATE POLICY "Staff read patrol routes"
  ON patrol_routes FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage patrol routes"
  ON patrol_routes FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

CREATE POLICY "Guards and admins read patrol sessions"
  ON patrol_sessions FOR SELECT
  USING (
    public.auth_user_role() = 'super_admin'
    OR mall_id = public.auth_user_mall_id()
  );

CREATE POLICY "Guards create patrol sessions"
  ON patrol_sessions FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN ('security_guard', 'mall_admin', 'super_admin')
  );

CREATE POLICY "Guards update own sessions"
  ON patrol_sessions FOR UPDATE
  USING (
    mall_id = public.auth_user_mall_id()
    AND (guard_id = auth.uid() OR public.auth_user_role() IN ('mall_admin', 'super_admin'))
  );

-- Checkpoint Scans: guards insert, all mall staff can read
CREATE POLICY "Staff read scans"
  ON checkpoint_scans FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Guards log scans"
  ON checkpoint_scans FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN ('security_guard', 'mall_admin', 'super_admin')
  );

-- Security Incidents
CREATE POLICY "Staff read incidents"
  ON security_incidents FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Guards create incidents"
  ON security_incidents FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN ('security_guard', 'mall_admin', 'super_admin')
  );

-- ─── Inventory ────────────────────────────────────────────────────────────────

CREATE POLICY "Staff read inventory"
  ON inventory_items FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage inventory catalog"
  ON inventory_items FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin', 'maintenance_chief'));

CREATE POLICY "Staff read stock movements"
  ON stock_movements FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Operators create stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN (
      'maintenance_chief', 'maintenance_operator', 'mall_admin', 'super_admin'
    )
  );

CREATE POLICY "Admins see import jobs"
  ON inventory_import_jobs FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins create import jobs"
  ON inventory_import_jobs FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

-- ─── Scoring ─────────────────────────────────────────────────────────────────

CREATE POLICY "All mall staff read scoring config"
  ON scoring_config FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins manage scoring config"
  ON scoring_config FOR ALL
  USING (public.auth_user_role() IN ('super_admin', 'mall_admin'));

CREATE POLICY "All mall staff read scores"
  ON score_snapshots FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Service role inserts scores"
  ON score_snapshots FOR INSERT
  WITH CHECK (TRUE); -- Edge Functions use service role

CREATE POLICY "All mall staff read asset scores"
  ON asset_score_records FOR SELECT
  USING (public.auth_user_role() = 'super_admin' OR mall_id = public.auth_user_mall_id());

CREATE POLICY "Admins record asset scores"
  ON asset_score_records FOR INSERT
  WITH CHECK (
    mall_id = public.auth_user_mall_id()
    AND public.auth_user_role() IN ('mall_admin', 'maintenance_chief', 'super_admin')
  );
