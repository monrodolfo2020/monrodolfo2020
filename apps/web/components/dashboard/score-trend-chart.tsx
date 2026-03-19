'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface ScoreHistoryItem {
  period_start: string
  period_end: string
  total_score: number | null
  score_maintenance_completion: number | null
  score_asset_status: number | null
}

export function ScoreTrendChart({ data }: { data: ScoreHistoryItem[] }) {
  const chartData = [...data]
    .reverse()
    .map((item) => ({
      period: format(parseISO(item.period_start), 'MMM yy', { locale: es }),
      total: item.total_score,
      mantenimiento: item.score_maintenance_completion,
      activos: item.score_asset_status,
    }))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendencia de Puntaje (6 meses)</h3>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          Sin datos de puntaje disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value?.toFixed(1)}`, '']}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="mantenimiento"
              name="Mantenimiento"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="activos"
              name="Activos"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
