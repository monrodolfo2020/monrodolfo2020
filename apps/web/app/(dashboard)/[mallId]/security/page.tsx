import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format, startOfDay } from 'date-fns'

export const metadata: Metadata = { title: 'Seguridad' }

interface PageProps {
  params: Promise<{ mallId: string }>
}

export default async function SecurityPage({ params }: PageProps) {
  const { mallId } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd')

  const [{ data: checkpoints }, { data: todaySessions }, { data: routes }] = await Promise.all([
    supabase
      .from('security_checkpoints')
      .select('id, name, zone:mall_zones(name), is_active')
      .eq('mall_id', mallId)
      .order('name'),

    supabase
      .from('patrol_sessions')
      .select(`
        id, status, started_at, completed_at, completion_percentage,
        guard:user_profiles(full_name),
        route:patrol_routes(name)
      `)
      .eq('mall_id', mallId)
      .gte('started_at', `${todayStr}T00:00:00Z`)
      .order('started_at', { ascending: false }),

    supabase
      .from('patrol_routes')
      .select('id, name, expected_duration_minutes, is_active')
      .eq('mall_id', mallId)
      .eq('is_active', true),
  ])

  const activeCheckpoints = (checkpoints ?? []).filter((c) => c.is_active)
  const inProgressSessions = (todaySessions ?? []).filter((s) => s.status === 'in_progress')

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Seguridad — Rondas</h1>

      {/* Active Sessions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Rondas Activas Ahora
          <span className="ml-2 text-xs font-normal text-gray-400">{format(new Date(), 'HH:mm')}</span>
        </h2>
        {inProgressSessions.length === 0 ? (
          <p className="text-sm text-gray-400">Sin rondas activas en este momento.</p>
        ) : (
          <div className="space-y-3">
            {inProgressSessions.map((session) => {
              const guard = Array.isArray(session.guard) ? session.guard[0] : session.guard
              const route = Array.isArray(session.route) ? session.route[0] : session.route
              return (
                <div key={session.id} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {guard?.full_name ?? 'Guardia'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ruta: {route?.name ?? '—'} · Iniciada: {format(new Date(session.started_at), 'HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">
                      {session.completion_percentage?.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-400">completado</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Today's Sessions History */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Rondas de Hoy</h2>
        {!todaySessions || todaySessions.length === 0 ? (
          <p className="text-sm text-gray-400">Sin rondas registradas hoy.</p>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((session) => {
              const guard = Array.isArray(session.guard) ? session.guard[0] : session.guard
              const route = Array.isArray(session.route) ? session.route[0] : session.route
              const statusColor =
                session.status === 'completed'
                  ? 'text-green-700 bg-green-50'
                  : session.status === 'incomplete'
                  ? 'text-yellow-700 bg-yellow-50'
                  : session.status === 'in_progress'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-700 bg-gray-50'

              return (
                <div key={session.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                    {session.status}
                  </span>
                  <span className="text-sm text-gray-700 flex-1">
                    {guard?.full_name ?? '—'} · {route?.name ?? '—'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(session.started_at), 'HH:mm')}
                    {session.completed_at && ` — ${format(new Date(session.completed_at), 'HH:mm')}`}
                  </span>
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">
                    {session.completion_percentage?.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Checkpoint Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Checkpoints ({activeCheckpoints.length} activos)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeCheckpoints.map((cp) => {
            const zone = Array.isArray(cp.zone) ? cp.zone[0] : cp.zone
            return (
              <div key={cp.id} className="border border-gray-100 rounded-md p-3">
                <p className="text-sm font-medium text-gray-800">{cp.name}</p>
                {zone && <p className="text-xs text-gray-400">{zone.name}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Routes */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Rutas de Ronda</h2>
        <div className="space-y-2">
          {!routes || routes.length === 0 ? (
            <p className="text-sm text-gray-400">Sin rutas configuradas.</p>
          ) : (
            routes.map((route) => (
              <div key={route.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <span className="text-sm font-medium text-gray-800">{route.name}</span>
                {route.expected_duration_minutes && (
                  <span className="text-xs text-gray-400">
                    ~{route.expected_duration_minutes} min
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
