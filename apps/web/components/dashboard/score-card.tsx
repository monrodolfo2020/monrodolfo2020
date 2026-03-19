import { cn } from '@/lib/utils/cn'
import { getScoreGrade } from '@mall/types'

const GRADE_COLORS: Record<string, string> = {
  excelente: 'text-green-700 bg-green-50 border-green-200',
  bueno: 'text-blue-700 bg-blue-50 border-blue-200',
  regular: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  deficiente: 'text-orange-700 bg-orange-50 border-orange-200',
  critico: 'text-red-700 bg-red-50 border-red-200',
}

const GRADE_LABELS: Record<string, string> = {
  excelente: 'Excelente',
  bueno: 'Bueno',
  regular: 'Regular',
  deficiente: 'Deficiente',
  critico: 'Crítico',
}

interface ScoreCardProps {
  title: string
  score: number | null
  period: string
  highlighted?: boolean
}

export function ScoreCard({ title, score, period, highlighted }: ScoreCardProps) {
  const grade = score !== null ? getScoreGrade(score) : null

  return (
    <div
      className={cn(
        'rounded-lg border p-5',
        highlighted ? 'bg-brand-600 border-brand-700 text-white' : 'bg-white border-gray-200'
      )}
    >
      <p className={cn('text-sm font-medium', highlighted ? 'text-brand-100' : 'text-gray-500')}>
        {title}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span
          className={cn(
            'text-4xl font-bold',
            highlighted ? 'text-white' : 'text-gray-900'
          )}
        >
          {score !== null ? score.toFixed(1) : '—'}
        </span>
        <span className={cn('text-lg mb-1', highlighted ? 'text-brand-200' : 'text-gray-400')}>
          / 100
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={cn('text-xs', highlighted ? 'text-brand-200' : 'text-gray-400')}>
          {period}
        </span>
        {grade && !highlighted && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full border',
              GRADE_COLORS[grade]
            )}
          >
            {GRADE_LABELS[grade]}
          </span>
        )}
        {grade && highlighted && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
            {GRADE_LABELS[grade]}
          </span>
        )}
      </div>
    </div>
  )
}
