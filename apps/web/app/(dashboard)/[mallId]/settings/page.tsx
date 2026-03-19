import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Configuración' }

interface PageProps {
  params: Promise<{ mallId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { mallId } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('*')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  const { data: scoringConfig } = await supabase
    .from('scoring_config')
    .select('*')
    .eq('mall_id', mallId)
    .single()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Mall Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Información del Centro Comercial</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500 shrink-0">Nombre</dt>
            <dd className="text-gray-900">{mall.name}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500 shrink-0">Ciudad</dt>
            <dd className="text-gray-900">{mall.city ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500 shrink-0">Plan</dt>
            <dd className="capitalize text-gray-900">{mall.subscription_plan}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500 shrink-0">Zona horaria</dt>
            <dd className="text-gray-900">{mall.timezone}</dd>
          </div>
        </dl>
      </div>

      {/* Scoring Weights */}
      {scoringConfig && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pesos del Sistema de Calificación</h2>
          <p className="text-xs text-gray-500 mb-4">
            Los pesos determinan la importancia de cada dimensión en el puntaje final (deben sumar 100).
          </p>
          <div className="space-y-3">
            {[
              { label: 'Completitud de Mantenimiento', key: 'weight_maintenance_completion' },
              { label: 'Puntualidad de Mantenimiento', key: 'weight_maintenance_timeliness' },
              { label: 'Estado de Activos', key: 'weight_asset_status' },
              { label: 'Resolución de Hallazgos', key: 'weight_findings_resolution' },
              { label: 'Cumplimiento Rondas', key: 'weight_security_compliance' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full"
                      style={{ width: `${scoringConfig[key as keyof typeof scoringConfig]}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {scoringConfig[key as keyof typeof scoringConfig]}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Para modificar los pesos, contacte a soporte técnico.
          </p>
        </div>
      )}
    </div>
  )
}
