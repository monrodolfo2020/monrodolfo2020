// Shared design tokens used by both web and mobile

export const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  score: {
    excelente: '#16a34a',   // green-600
    bueno: '#2563eb',       // blue-600
    regular: '#d97706',     // amber-600
    deficiente: '#ea580c',  // orange-600
    critico: '#dc2626',     // red-600
  },
  severity: {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#94a3b8',
  },
  task: {
    scheduled: '#94a3b8',
    in_progress: '#3b82f6',
    completed: '#f59e0b',
    validated: '#10b981',
    rejected: '#ef4444',
    missed: '#dc2626',
  },
}

export type ScoreGrade = 'excelente' | 'bueno' | 'regular' | 'deficiente' | 'critico'
