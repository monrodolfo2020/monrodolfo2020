import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format, startOfDay } from 'date-fns'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mantenimiento' }

interface PageProps {
  params: Promise<{ mallId: string }>
  searchParams: Promise<{ date?: string; status?: string }>
}

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-yellow-100 text-yellow-700',
  validated: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  missed: 'bg-red-50 text-red-500',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  validated: 'Validada',
  rejected: 'Rechazada',
  missed: 'Perdida',
}

export default async function MaintenancePage({ params, searchParams }: PageProps) {
  const { mallId } = await params
  const { date, status } = await searchParams

  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  const selectedDate = date ?? format(startOfDay(new Date()), 'yyyy-MM-dd')

  let query = supabase
    .from('maintenance_tasks')
    .select(`
      id, title, status, scheduled_date, scheduled_time, description,
      activity_type:maintenance_activity_types(name, category),
      assigned_to:user_profiles(full_name),
      zone:mall_zones(name),
      photos:maintenance_photos(id)
    `)
    .eq('mall_id', mallId)
    .eq('scheduled_date', selectedDate)
    .order('scheduled_time')

  if (status) {
    query = query.eq('status', status)
  }

  const { data: tasks } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
      </div>

      {/* Date + Filter Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Fecha</label>
          <input
            type="date"
            defaultValue={selectedDate}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            readOnly
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'scheduled', 'in_progress', 'completed', 'validated', 'rejected', 'missed'].map((s) => (
            <Link
              key={s}
              href={`/${mallId}/maintenance?date=${selectedDate}${s ? `&status=${s}` : ''}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                (status ?? '') === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s ? STATUS_LABEL[s] : 'Todos'}
            </Link>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {!tasks || tasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">Sin tareas para esta fecha y filtros seleccionados.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const activityType = Array.isArray(task.activity_type)
              ? task.activity_type[0]
              : task.activity_type
            const assignedTo = Array.isArray(task.assigned_to)
              ? task.assigned_to[0]
              : task.assigned_to
            const zone = Array.isArray(task.zone) ? task.zone[0] : task.zone
            const photoCount = Array.isArray(task.photos) ? task.photos.length : 0

            return (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[task.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {task.scheduled_time && <span>{task.scheduled_time.slice(0, 5)}</span>}
                    {activityType && (
                      <span className="capitalize">{activityType.category}</span>
                    )}
                    {zone && <span>{zone.name}</span>}
                    {assignedTo && <span>{assignedTo.full_name}</span>}
                    {photoCount > 0 && <span>{photoCount} foto(s)</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
