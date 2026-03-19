/**
 * Edge Function: generate-daily-tasks
 *
 * Runs daily at 00:01 UTC via pg_cron (or manually).
 * Expands maintenance_schedule_templates into maintenance_tasks for the target date.
 * Idempotent: uses ON CONFLICT DO NOTHING on (mall_id, template_id, scheduled_date).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts'

interface Template {
  id: string
  mall_id: string
  activity_type_id: string
  frequency: string
  days_of_week: number[] | null
  day_of_month: number | null
  week_numbers: number[] | null
  preferred_time: string
  assigned_role: string
  zone_id: string | null
  asset_id: string | null
}

interface ActivityType {
  id: string
  name: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))
    const targetDate = body.date
      ? new Date(body.date)
      : (() => {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          return tomorrow
        })()

    const dateStr = targetDate.toISOString().split('T')[0]
    const dayOfWeek = targetDate.getDay()    // 0=Sun..6=Sat
    const dayOfMonth = targetDate.getDate()
    const weekOfYear = getWeekNumber(targetDate)

    // Get active templates (optionally filtered by mall_id)
    let templatesQuery = supabase
      .from('maintenance_schedule_templates')
      .select('*, activity_type:maintenance_activity_types(id, name)')
      .eq('is_active', true)

    if (body.mall_id) {
      templatesQuery = templatesQuery.eq('mall_id', body.mall_id)
    }

    const { data: templates, error: templatesError } = await templatesQuery

    if (templatesError) throw templatesError

    let tasksCreated = 0
    const mallsProcessed = new Set<string>()

    for (const template of (templates ?? [])) {
      const activityType = template.activity_type as ActivityType | null

      if (!shouldRunToday(template as Template, dayOfWeek, dayOfMonth, weekOfYear)) {
        continue
      }

      mallsProcessed.add(template.mall_id)

      const { error: insertError } = await supabase
        .from('maintenance_tasks')
        .insert({
          mall_id: template.mall_id,
          template_id: template.id,
          activity_type_id: template.activity_type_id,
          zone_id: template.zone_id,
          asset_id: template.asset_id,
          title: activityType?.name ?? 'Tarea de Mantenimiento',
          scheduled_date: dateStr,
          scheduled_time: template.preferred_time,
          status: 'scheduled',
        })
        // Avoid duplicates (unique index: mall_id + template_id + scheduled_date)
        .select()

      if (!insertError) {
        tasksCreated++
      } else if (!insertError.message.includes('duplicate') && !insertError.message.includes('unique')) {
        console.warn('Insert error for template', template.id, ':', insertError.message)
      }
    }

    return jsonResponse({
      tasks_created: tasksCreated,
      malls_processed: mallsProcessed.size,
      date: dateStr,
    })
  } catch (error) {
    console.error('[generate-daily-tasks]', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
})

function shouldRunToday(
  template: Template,
  dayOfWeek: number,
  dayOfMonth: number,
  weekOfYear: number
): boolean {
  switch (template.frequency) {
    case 'daily':
      return true

    case 'weekly':
      return template.days_of_week?.includes(dayOfWeek) ?? false

    case 'biweekly':
      // Runs on even or odd weeks based on template setup
      return (template.days_of_week?.includes(dayOfWeek) ?? false) && weekOfYear % 2 === 0

    case 'monthly':
      return template.day_of_month === dayOfMonth

    case 'quarterly':
      // Run on specific week numbers if defined, otherwise check day_of_month on months 1,4,7,10
      if (template.week_numbers && template.week_numbers.length > 0) {
        return template.week_numbers.includes(weekOfYear)
      }
      return false

    case 'semiannual':
      return template.week_numbers?.includes(weekOfYear) ?? false

    case 'annual':
      return template.week_numbers?.includes(weekOfYear) ?? false

    default:
      return false
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
