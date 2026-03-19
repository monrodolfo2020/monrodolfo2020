import { z } from 'zod'

export const CreateCheckpointSchema = z.object({
  mall_id: z.string().uuid(),
  zone_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(200),
  location_notes: z.string().max(500).nullable().optional(),
  geolocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0),
  }).nullable().optional(),
  geofence_radius_meters: z.number().int().min(5).max(500).default(50),
})

export const CreatePatrolRouteSchema = z.object({
  mall_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).nullable().optional(),
  checkpoint_sequence: z.array(z.string().uuid()).min(1),
  expected_duration_minutes: z.number().int().min(1).max(480).nullable().optional(),
  schedule_type: z.enum(['fixed', 'interval', 'random']).nullable().optional(),
  scheduled_times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).nullable().optional(),
  interval_minutes: z.number().int().min(15).max(480).nullable().optional(),
})

export const RecordCheckpointScanSchema = z.object({
  session_id: z.string().uuid(),
  checkpoint_id: z.string().uuid(),
  scanned_at: z.string().datetime(),
  qr_payload: z.string().min(1),
  geolocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0),
    altitude: z.number().optional(),
  }),
  device_info: z.record(z.unknown()).optional(),
  client_id: z.string().uuid().optional(),
})

export const StartPatrolSessionSchema = z.object({
  route_id: z.string().uuid(),
  started_at: z.string().datetime().optional(),
  client_id: z.string().uuid().optional(),
})

export const CreateSecurityIncidentSchema = z.object({
  mall_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  incident_type: z.enum([
    'theft', 'vandalism', 'medical', 'fire',
    'unauthorized_access', 'suspicious_activity', 'other',
  ]),
  description: z.string().min(10).max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  geolocation: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
  }).nullable().optional(),
  client_id: z.string().uuid().optional(),
})

export type CreateCheckpointInput = z.infer<typeof CreateCheckpointSchema>
export type CreatePatrolRouteInput = z.infer<typeof CreatePatrolRouteSchema>
export type RecordCheckpointScanInput = z.infer<typeof RecordCheckpointScanSchema>
export type StartPatrolSessionInput = z.infer<typeof StartPatrolSessionSchema>
export type CreateSecurityIncidentInput = z.infer<typeof CreateSecurityIncidentSchema>
