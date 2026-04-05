"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AI_MODELS } from '@/lib/ai/openrouter'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { WizardData } from './index'

export function Step3ModelSelect({
  data, onSubmit, onBack,
}: { data: WizardData; onSubmit: (d: Partial<WizardData>) => void; onBack: () => void }) {
  const [modelId, setModelId] = useState(data.model_id)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await onSubmit({ model_id: modelId })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-semibold">Elige el modelo de IA</h2>
          <p className="text-muted-foreground text-sm">
            El modelo determina la calidad de las respuestas de tu agente. Puedes cambiarlo después.
          </p>
        </div>
        <div className="space-y-5">
          <div className="space-y-3">
            {AI_MODELS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelId(m.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                  modelId === m.id ? 'border-black bg-black/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{m.name}</span>
                    <Badge variant={m.badge === 'Gratis' ? 'success' : m.badge === 'Popular' ? 'default' : 'secondary'}
                      className="text-xs">{m.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                  modelId === m.id ? 'border-black bg-black' : 'border-slate-300'
                }`} />
              </button>
            ))}
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            💡 <strong>Recomendación:</strong> Empieza con el modelo gratuito. Puedes cambiarlo en cualquier momento desde la configuración del agente.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Atrás
            </Button>
            <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear mi agente ✨
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
