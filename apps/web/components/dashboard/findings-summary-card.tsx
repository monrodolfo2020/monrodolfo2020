import { cn } from '@/lib/utils/cn'

const SEVERITY_STYLE: Record<string, string> = {
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

interface Finding {
  id: string
  title: string
  severity: string
  status: string
  resolution_date: string | null
}

export function FindingsSummaryCard({ findings }: { findings: Finding[] }) {
  const overdueCount = findings.filter(
    (f) => f.resolution_date && new Date(f.resolution_date) < new Date()
  ).length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Hallazgos Abiertos</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{findings.length}</span>
          {overdueCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
              {overdueCount} vencidos
            </span>
          )}
        </div>
      </div>

      {findings.length === 0 ? (
        <p className="text-xs text-gray-400">Sin hallazgos abiertos</p>
      ) : (
        <div className="space-y-2">
          {findings.slice(0, 4).map((finding) => (
            <div key={finding.id} className="flex items-start gap-2">
              <span
                className={cn(
                  'shrink-0 text-xs px-1.5 py-0.5 rounded border',
                  SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE['low']
                )}
              >
                {SEVERITY_LABEL[finding.severity] ?? finding.severity}
              </span>
              <span className="text-xs text-gray-700 line-clamp-1">{finding.title}</span>
            </div>
          ))}
          {findings.length > 4 && (
            <p className="text-xs text-gray-400">+{findings.length - 4} más</p>
          )}
        </div>
      )}
    </div>
  )
}
