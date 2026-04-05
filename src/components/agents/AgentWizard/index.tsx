"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Personality } from './Step2Personality'
import { Step3ModelSelect } from './Step3ModelSelect'
import { generateAutoSystemPrompt } from '@/lib/ai/prompts'
import { Loader2 } from 'lucide-react'

export interface WizardData {
  name: string
  description: string
  tone: string
  system_prompt: string
  model_id: string
}

const STEPS = ['Identidad', 'Personalidad', 'Modelo IA']

export function AgentWizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WizardData>({
    name: '',
    description: '',
    tone: 'professional',
    system_prompt: '',
    model_id: 'qwen/qwen-2.5-7b-instruct:free',
  })
  const router = useRouter()

  function updateData(partial: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  function handleNext(partial: Partial<WizardData>) {
    const updated = { ...data, ...partial }
    if (step === 1 && !updated.system_prompt) {
      updated.system_prompt = generateAutoSystemPrompt(updated.name, updated.description, updated.tone)
    }
    setData(updated)
    setStep(s => s + 1)
  }

  async function handleSubmit(partial: Partial<WizardData>) {
    const final = { ...data, ...partial }
    setLoading(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(final),
      })
      if (!res.ok) throw new Error('Error al crear el agente')
      const { id } = await res.json()
      router.push(`/agents/${id}/knowledge`)
    } catch {
      setLoading(false)
      alert('Ocurrió un error. Por favor intenta de nuevo.')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      <p className="text-muted-foreground">Creando tu agente...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 < step ? 'bg-black text-white' :
                i + 1 === step ? 'bg-black text-white ring-4 ring-black/20' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i + 1 === step ? 'font-semibold' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-12px] ${i + 1 < step ? 'bg-black' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && <Step1BasicInfo data={data} onNext={handleNext} />}
      {step === 2 && <Step2Personality data={data} onNext={handleNext} onBack={() => setStep(1)} />}
      {step === 3 && <Step3ModelSelect data={data} onSubmit={handleSubmit} onBack={() => setStep(2)} />}
    </div>
  )
}
