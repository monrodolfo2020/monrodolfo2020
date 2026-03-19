import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Reportes' }

interface PageProps {
  params: Promise<{ mallId: string }>
}

export default async function ReportsPage({ params }: PageProps) {
  const { mallId } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('*')
    .eq('mall_id', mallId)
    .eq('period_type', 'monthly')
    .order('period_end', { ascending: false })
    .limit(12)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes</h1>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Período</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Mantenimiento</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Puntualidad</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Activos</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Hallazgos</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Seguridad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!snapshots || snapshots.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Sin reportes generados. Los puntajes se calculan automáticamente cada noche.
                </td>
              </tr>
            ) : (
              snapshots.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.period_start} — {s.period_end}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-brand-700">
                    {s.total_score?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.score_maintenance_completion?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.score_maintenance_timeliness?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.score_asset_status?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.score_findings_resolution?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.score_security_compliance?.toFixed(1) ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
