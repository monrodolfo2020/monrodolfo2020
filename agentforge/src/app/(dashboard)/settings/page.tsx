"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

interface ServiceStatus {
  ok: boolean
  message: string
}

interface HealthResult {
  supabase: ServiceStatus
  openrouter: ServiceStatus
  openai: ServiceStatus
}

function StatusRow({ name, status }: { name: string; status: ServiceStatus | null }) {
  if (!status) return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="font-medium text-sm">{name}</span>
      <span className="text-xs text-muted-foreground">—</span>
    </div>
  )
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        {status.ok
          ? <CheckCircle className="w-4 h-4 text-green-500" />
          : <XCircle className="w-4 h-4 text-red-500" />}
        <span className="font-medium text-sm">{name}</span>
      </div>
      <span className={`text-xs ${status.ok ? 'text-muted-foreground' : 'text-red-600'}`}>
        {status.message}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkHealth() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuraci\u00f3n</h1>
        <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
      </div>

      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Estado de las conexiones</h2>
            <p className="text-sm text-muted-foreground">Verifica que todas las APIs est\u00e9n funcionando</p>
          </div>
          <Button onClick={checkHealth} disabled={loading} variant="outline" size="sm" className="gap-2">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="divide-y rounded-lg border bg-slate-50/50 px-4">
          <StatusRow name="Base de datos (Supabase)" status={result?.supabase ?? null} />
          <StatusRow name="Generaci\u00f3n de texto (OpenRouter)" status={result?.openrouter ?? null} />
          <StatusRow name="Embeddings (OpenAI)" status={result?.openai ?? null} />
        </div>

        {result && (
          <p className={`text-xs ${result.supabase.ok && result.openrouter.ok ? 'text-green-600' : 'text-red-600'}`}>
            {result.supabase.ok && result.openrouter.ok
              ? '\u2713 Sistema listo para usar'
              : '\u2717 Hay problemas \u2014 el chat puede no funcionar correctamente'}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-amber-50 p-6 text-center">
        <h3 className="font-semibold text-lg mb-2">\ud83d\udcb3 Sistema de pagos \u2014 Pr\u00f3ximamente</h3>
        <p className="text-sm text-amber-700">
          Pronto podr\u00e1s suscribirte a planes premium para acceder a m\u00e1s agentes, m\u00e1s conocimiento y modelos de IA avanzados.
        </p>
      </div>
    </div>
  )
}
