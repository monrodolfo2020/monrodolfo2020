-- ============================================================
-- Migration 008: Demo Seed Data
-- Mall: "Centro Comercial Demo"
-- Users: admin, maintenance chief, operator, security guard
-- NOTE: Passwords are set via Supabase Auth — this seed only
--       inserts the profile rows. Use the setup script or
--       Supabase dashboard to create the auth.users first.
-- ============================================================

-- ─── Demo Mall ────────────────────────────────────────────────────────────────

INSERT INTO malls (id, name, slug, address, city, country, timezone, subscription_plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Centro Comercial Demo',
  'demo-mall',
  'Av. Insurgentes Sur 1234',
  'Ciudad de México',
  'MX',
  'America/Mexico_City',
  'premium'
) ON CONFLICT (id) DO NOTHING;

-- ─── Demo Zones ───────────────────────────────────────────────────────────────

INSERT INTO mall_zones (id, mall_id, name, zone_type, floor_level) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Estacionamiento Norte', 'parking', 0),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Planta Baja', 'common_area', 1),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Planta Alta', 'common_area', 2),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Área Técnica', 'technical', 0)
ON CONFLICT (id) DO NOTHING;

-- ─── Demo Assets ──────────────────────────────────────────────────────────────

INSERT INTO assets (id, mall_id, zone_id, name, asset_type, serial_number, status) VALUES
  -- Luminarias
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Luminaria PB-01', 'lighting', 'LUM-PB-001', 'operational'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Luminaria PB-02', 'lighting', 'LUM-PB-002', 'operational'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'Luminaria PA-01', 'lighting', 'LUM-PA-001', 'failed'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Luminaria EST-01', 'lighting', 'LUM-EST-001', 'operational'),
  -- CCTV
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Cámara PB-01', 'cctv', 'CAM-PB-001', 'operational'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Cámara EST-01', 'cctv', 'CAM-EST-001', 'maintenance'),
  -- Generador
  ('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', 'Generador Principal', 'generator', 'GEN-001', 'operational')
ON CONFLICT (id) DO NOTHING;

-- ─── Maintenance Activity Types ───────────────────────────────────────────────

INSERT INTO maintenance_activity_types (id, mall_id, name, category, estimated_duration_minutes, scoring_weight) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'Revisión de luminarias', 'lighting',     60,  1.0),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', 'Limpieza de cámaras CCTV', 'cctv',      45,  1.0),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', 'Prueba de generador', 'generator',      90,  2.0),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', 'Revisión eléctrica general', 'electrical', 120, 1.5),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', 'Revisión de plomería', 'plumbing',      60,  1.0)
ON CONFLICT (id) DO NOTHING;

-- ─── Schedule Templates ───────────────────────────────────────────────────────

INSERT INTO maintenance_schedule_templates
  (id, mall_id, activity_type_id, zone_id, frequency, recurrence_days, scheduled_time, assigned_role)
VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'daily', NULL, '08:00', 'maintenance_operator'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0001-000000000004',
    'weekly', ARRAY[1], '09:00', 'maintenance_chief'
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0001-000000000004',
    'monthly', ARRAY[1], '10:00', 'maintenance_chief'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Security Checkpoints ─────────────────────────────────────────────────────

INSERT INTO security_checkpoints
  (id, mall_id, zone_id, name, latitude, longitude, geofence_radius_meters, hmac_secret)
VALUES
  (
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Entrada Estacionamiento Norte',
    19.4284, -99.1277, 30,
    encode(gen_random_bytes(32), 'hex')
  ),
  (
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'Acceso Principal PB',
    19.4285, -99.1278, 25,
    encode(gen_random_bytes(32), 'hex')
  ),
  (
    '00000000-0000-0000-0005-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000004',
    'Área Técnica',
    19.4283, -99.1276, 20,
    encode(gen_random_bytes(32), 'hex')
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Patrol Route ─────────────────────────────────────────────────────────────

INSERT INTO patrol_routes (id, mall_id, name, checkpoint_sequence, estimated_duration_minutes) VALUES
  (
    '00000000-0000-0000-0006-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Ronda Nocturna Completa',
    ARRAY[
      '00000000-0000-0000-0005-000000000001'::UUID,
      '00000000-0000-0000-0005-000000000002'::UUID,
      '00000000-0000-0000-0005-000000000003'::UUID
    ],
    45
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Scoring Config ───────────────────────────────────────────────────────────

INSERT INTO scoring_config (
  id, mall_id,
  weight_maintenance_completion,
  weight_maintenance_timeliness,
  weight_asset_status,
  weight_findings_resolution,
  weight_security_compliance,
  late_penalty_per_hour,
  max_late_penalty
) VALUES (
  '00000000-0000-0000-0007-000000000001',
  '00000000-0000-0000-0000-000000000001',
  30, 20, 25, 15, 10,
  2.0, 50.0
) ON CONFLICT (mall_id) DO NOTHING;

-- ─── Demo Inventory (10 items base) ──────────────────────────────────────────

INSERT INTO inventory_items
  (mall_id, sku, name, category, unit_of_measure, unit_cost, minimum_stock, current_stock, maximum_stock, supplier_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'LUM-001', 'Foco LED 18W',               'lighting',          'piece',  4.50,  20,  85,  200, 'ElectroPro S.A.'),
  ('00000000-0000-0000-0000-000000000001', 'LUM-002', 'Foco LED 9W',                'lighting',          'piece',  2.80,  30, 120,  300, 'ElectroPro S.A.'),
  ('00000000-0000-0000-0000-000000000001', 'ELE-001', 'Breaker 20A',                'electrical',        'piece', 12.00,  10,  35,   80, 'DistElec Ltda.'),
  ('00000000-0000-0000-0000-000000000001', 'PLU-001', 'Llave de paso 1/2"',         'plumbing',          'piece',  8.00,   8,  22,   60, 'HidroMax S.A.'),
  ('00000000-0000-0000-0000-000000000001', 'LIM-001', 'Desinfectante multiusos (galón)', 'cleaning_supplies', 'gallon', 6.50, 10, 45, 100, 'CleanPro'),
  ('00000000-0000-0000-0000-000000000001', 'HW-001',  'Tornillos cabeza plana 3/8" (caja x100)', 'hardware', 'box', 3.50, 10, 28, 80, 'FerreMall'),
  ('00000000-0000-0000-0000-000000000001', 'COM-001', 'Aceite de motor 15W40 (galón)', 'fuel',            'gallon', 14.00, 10,  38,   80, 'PetroServ'),
  ('00000000-0000-0000-0000-000000000001', 'SEG-001', 'Extintor CO2 5kg',           'safety',            'piece', 65.00,   4,  12,   20, 'SafeGuard S.A.'),
  ('00000000-0000-0000-0000-000000000001', 'PIN-001', 'Pintura látex blanco (galón)', 'paint',           'gallon', 12.00,   5,  18,   50, 'PintaCentro'),
  ('00000000-0000-0000-0000-000000000001', 'HVAC-001','Filtro de aire acondicionado 24x24', 'hvac',       'piece',  8.50,   8,  24,   60, 'ClimaTech')
ON CONFLICT DO NOTHING;
