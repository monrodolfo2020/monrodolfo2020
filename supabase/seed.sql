-- ============================================================
-- Seed Data — Demo Mall for Development
-- ============================================================

-- Demo mall
INSERT INTO malls (id, name, slug, address, city, country, timezone, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mall Demo Ciudad',
  'mall-demo',
  'Av. Reforma 100, Col. Centro',
  'Ciudad de México',
  'MX',
  'America/Mexico_City',
  TRUE
);

-- Zones
INSERT INTO mall_zones (id, mall_id, name, zone_type, floor_level) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Planta Baja', 'retail', 0),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Primer Piso', 'retail', 1),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Estacionamiento Norte', 'parking', 0),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Cuarto Técnico', 'technical', -1),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Área de Comida', 'food_court', 1);

-- Assets
INSERT INTO assets (mall_id, zone_id, asset_type, name, code, status) VALUES
  -- Luminaires
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'luminaire', 'Luminaria Planta Baja 001', 'LUM-PB-001', 'operational'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'luminaire', 'Luminaria Primer Piso 001', 'LUM-PP-001', 'operational'),
  -- CCTV
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'cctv_camera', 'Cámara Estacionamiento 001', 'CAM-EST-001', 'operational'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'cctv_camera', 'Cámara Entrada Principal', 'CAM-ENT-001', 'operational'),
  -- Generator
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'generator', 'Generador Principal', 'GEN-001', 'operational'),
  -- Elevator
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'elevator', 'Elevador Central 1', 'ELV-001', 'operational');

-- Maintenance Activity Types
INSERT INTO maintenance_activity_types (mall_id, name, category, estimated_duration_minutes, requires_photos, photo_count_required, scoring_weight)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Limpieza General de Pasillos', 'cleaning', 120, TRUE, 2, 1.0),
  ('00000000-0000-0000-0000-000000000001', 'Revisión Sistema Eléctrico', 'electrical', 90, TRUE, 3, 1.5),
  ('00000000-0000-0000-0000-000000000001', 'Inspección Cámaras CCTV', 'security_systems', 60, TRUE, 2, 1.2),
  ('00000000-0000-0000-0000-000000000001', 'Revisión Planta de Agua', 'water', 60, TRUE, 2, 1.3),
  ('00000000-0000-0000-0000-000000000001', 'Limpieza Estacionamiento', 'cleaning', 180, TRUE, 3, 1.0),
  ('00000000-0000-0000-0000-000000000001', 'Revisión Red WiFi', 'networks', 45, FALSE, 0, 0.8),
  ('00000000-0000-0000-0000-000000000001', 'Prueba Sistema Contra Incendios', 'fire_safety', 90, TRUE, 4, 2.0),
  ('00000000-0000-0000-0000-000000000001', 'Revisión Elevadores', 'general', 60, TRUE, 2, 1.5);

-- Inventory Items
INSERT INTO inventory_items (mall_id, sku, name, category, unit_of_measure, unit_cost, minimum_stock, current_stock) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LMP-LED-001', 'Foco LED 18W', 'lighting', 'piece', 85.00, 20, 45),
  ('00000000-0000-0000-0000-000000000001', 'LMP-FLU-001', 'Tubo Fluorescente T8 32W', 'lighting', 'piece', 65.00, 15, 30),
  ('00000000-0000-0000-0000-000000000001', 'ELEC-CBL-001', 'Cable THW 12 AWG (metro)', 'electrical', 'meter', 12.50, 100, 250),
  ('00000000-0000-0000-0000-000000000001', 'LIMP-DET-001', 'Detergente Multiusos 5L', 'cleaning_supplies', 'liter', 45.00, 10, 25),
  ('00000000-0000-0000-0000-000000000001', 'LIMP-MOP-001', 'Mopa de Algodón', 'cleaning_supplies', 'piece', 120.00, 5, 12),
  ('00000000-0000-0000-0000-000000000001', 'COMB-DIES-001', 'Diésel para Generador (litro)', 'fuel', 'liter', 22.50, 200, 500);

-- Security Checkpoints
INSERT INTO security_checkpoints (mall_id, zone_id, name, location_notes, qr_code, qr_secret, geolocation, geofence_radius_meters) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Checkpoint Entrada Principal', 'Puerta de entrada principal, lado derecho',
   'CP-DEMO-001', 'demo-secret-001',
   '{"lat": 19.4326, "lng": -99.1332, "accuracy": 5}', 30),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   'Checkpoint Estacionamiento Norte', 'Caseta de control norte',
   'CP-DEMO-002', 'demo-secret-002',
   '{"lat": 19.4330, "lng": -99.1335, "accuracy": 5}', 50),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
   'Checkpoint Cuarto Técnico', 'Frente a la puerta del cuarto técnico',
   'CP-DEMO-003', 'demo-secret-003',
   '{"lat": 19.4320, "lng": -99.1340, "accuracy": 5}', 20);

-- Patrol Route
INSERT INTO patrol_routes (mall_id, name, description, checkpoint_sequence, expected_duration_minutes, schedule_type, interval_minutes)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'Ronda Estándar',
  'Ronda perimetral estándar cubriendo todos los puntos clave',
  ARRAY(SELECT id FROM security_checkpoints WHERE mall_id = '00000000-0000-0000-0000-000000000001' ORDER BY name),
  30,
  'interval',
  120;
