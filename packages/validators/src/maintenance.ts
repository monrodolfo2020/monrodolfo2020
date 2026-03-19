import { z } from 'zod'

export const MaintenanceActivityTypeSchema = z.object({
  mall_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  category: z.enum([
    'cleaning', 'water', 'electrical', 'security_systems',
    'networks', 'lighting', 'hvac', 'fire_safety', 'general',
  ]),
  description: z.string().max(1000).nullable().optional(),
  estimated_duration_minutes: z.number().int().min(1).max(480).default(60),
  requires_photos: z.boolean().default(true),
  photo_count_required: z.number().int().min(0).max(20).default(1),
  scoring_weight: z.number().min(0).max(10).default(1.0),
  sop_url: z.string().url().nullable().optional(),
})

export const MaintenanceScheduleTemplateSchema = z.object({
  mall_id: z.string().uuid(),
  activity_type_id: z.string().uuid(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']),
  days_of_week: z.array(z.number().int().min(0).max(6)).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  week_numbers: z.array(z.number().int().min(1).max(53)).nullable().optional(),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  assigned_role: z.string().default('maintenance_operator'),
  zone_id: z.string().uuid().nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const CompleteMaintenanceTaskSchema = z.object({
  task_id: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  completed_at: z.string().datetime().optional(),
})

export const ValidateMaintenanceTaskSchema = z.object({
  task_id: z.string().uuid(),
  action: z.enum(['validate', 'reject']),
  rejection_reason: z.string().max(500).optional(),
}).refine(
  (data) => data.action === 'validate' || (data.action === 'reject' && !!data.rejection_reason),
  { message: 'rejection_reason is required when rejecting a task', path: ['rejection_reason'] }
)

export const CreateFindingSchema = z.object({
  mall_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  zone_id: z.string().uuid().nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  client_id: z.string().uuid().optional(),
})

export const UpdateFindingSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'dismissed']).optional(),
  resolution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  resolution_notes: z.string().max(2000).nullable().optional(),
})

export type MaintenanceActivityTypeInput = z.infer<typeof MaintenanceActivityTypeSchema>
export type MaintenanceScheduleTemplateInput = z.infer<typeof MaintenanceScheduleTemplateSchema>
export type CompleteMaintenanceTaskInput = z.infer<typeof CompleteMaintenanceTaskSchema>
export type ValidateMaintenanceTaskInput = z.infer<typeof ValidateMaintenanceTaskSchema>
export type CreateFindingInput = z.infer<typeof CreateFindingSchema>
export type UpdateFindingInput = z.infer<typeof UpdateFindingSchema>
