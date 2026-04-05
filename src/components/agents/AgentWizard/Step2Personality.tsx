"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { generateAutoSystemPrompt } from '@/lib/ai/prompts'
import type { WizardData } from './index'

const TONES = [
  { id: 'professional', label: 'Profesional', emoji: '💼', desc: 'Preciso y orientado a resultados' },
  { id: 'friendly', label: 'Amigable', emoji: '😊', desc: 'Cercano y accesible' },
  { id: 'formal', label: 'Formal', emoji: '🎓', desc: 'Riguroso y académico' },
  { id: 'casual', label: 'Casual', emoji: '💬', desc: 'Relajado y conversacional' },
  { id: 'enthusiastic', label: 'Entusiasta', emoji: '🚀', desc: 'Motivador y energético' },
]

export function Step2Personality({
  data, onNext, onBack,
}: { data: WizardData; onNext: (d: Partial<WizardData>) => void; onBack: () => void }) {
  const [tone, setTone] = useState(data.tone)
  const [showPrompt, setShowPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState(data.system_prompt || '')

  const previewPrompt = customPrompt || generateAutoSystemPrompt(data.name, data.description, tone)

  function handleNext() {
    onNext({ tone, system_prompt: customPrompt })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-semibold">¿Cómo se comunica tu agente?</h2>
          <p className="text-muted-foreground text-sm">
            Elige el estilo de comunicación que mejor represente tu manera de trabajar.
          </p>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-2">
            {TONES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  tone === t.id ? 'border-black bg-black/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
                {tone === t.id && <div className="ml-auto w-2 h-2 rounded-full bg-black" />}
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowPrompt(s => !s)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showPrompt ? 'Ocultar' : 'Ver y personalizar'} las instrucciones del agente
            </button>
            {showPrompt && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={previewPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  rows={6}
                  className="text-xs font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Estas son las instrucciones que guían el comportamiento de tu agente.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Atrás
            </Button>
            <Button onClick={handleNext} className="flex-1 gap-2">
              Siguiente <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
