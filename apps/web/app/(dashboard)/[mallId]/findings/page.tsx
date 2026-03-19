import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Hallazgos' }

interface PageProps {
  params: Promise<{ mallId: string }>
  searchParams: Promise<{ status?: string; severity?: string }>
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
}

export default async function FindingsPage({ params, searchParams }: PageProps) {
  const { mallId } = await params
  const { status, severity } = await searchParams
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  let query = supabase
    .from('findings')
    .select(`
      id, title, description, severity, status, resolution_date,
      resolved_at, created_at,
      reported_by:user_profiles(full_name),
      zone:mall_zones(name),
      photos:finding_photos(id)
    `)
    .eq('mall_id', mallId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)

  const { data: findings } = await query

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hallazgos</h1>

      <div className="space-y-3">
        {!findings || findings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">Sin hallazgos registrados.</p>
          </div>
        ) : (
          findings.map((f) => {
            const reporter = Array.isArray(f.reported_by) ? f.reported_by[0] : f.reported_by
            const zone = Array.isArray(f.zone) ? f.zone[0] : f.zone
            const photoCount = Array.isArray(f.photos) ? f.photos.length : 0
            const isOverdue =
              f.resolution_date &&
              f.status !== 'resolved' &&
              new Date(f.resolution_date) < new Date()

            return (
              <div
                key={f.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                      SEVERITY_BADGE[f.severity] ?? SEVERITY_BADGE['low']
                    }`}
                  >
                    {SEVERITY_LABEL[f.severity] ?? f.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{f.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span>{STATUS_LABEL[f.status] ?? f.status}</span>
                      {zone && <span>{zone.name}</span>}
                      {reporter && <span>Por: {reporter.full_name}</span>}
                      <span>{format(new Date(f.created_at), 'dd/MM/yyyy')}</span>
                      {f.resolution_date && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          Resolver antes: {format(new Date(f.resolution_date), 'dd/MM/yyyy')}
                          {isOverdue && ' (VENCIDO)'}
                        </span>
                      )}
                      {photoCount > 0 && <span>{photoCount} foto(s)</span>}
                    </div>
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
