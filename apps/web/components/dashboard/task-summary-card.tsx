import { cn } from '@/lib/utils/cn'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programada', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En progreso', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-yellow-100 text-yellow-700' },
  validated: { label: 'Validada', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  missed: { label: 'Perdida', color: 'bg-red-100 text-red-700' },
}

interface Task {
  status: string
  title: string
  scheduled_time: string | null
}

export function TaskSummaryCard({ tasks }: { tasks: Task[] }) {
  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Tareas de Hoy</h3>
        <span className="text-2xl font-bold text-gray-900">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400">Sin tareas programadas para hoy</p>
      ) : (
        <div className="space-y-1">
          {Object.entries(counts).map(([status, count]) => {
            const info = STATUS_LABEL[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
            return (
              <div key={status} className="flex items-center justify-between">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', info.color)}>
                  {info.label}
                </span>
                <span className="text-sm font-medium text-gray-700">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
