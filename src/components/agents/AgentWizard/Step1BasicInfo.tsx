"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import type { WizardData } from './index'

export function Step1BasicInfo({ data, onNext }: { data: WizardData; onNext: (d: Partial<WizardData>) => void }) {
  const [name, setName] = useState(data.name)
  const [description, setDescription] = useState(data.description)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onNext({ name: name.trim(), description: description.trim() })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-semibold">¿Quién es tu agente?</h2>
          <p className="text-muted-foreground text-sm">
            Dale una identidad a tu asistente de IA. Esta información aparecerá cuando lo compartas.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nombre del agente *</Label>
            <Input
              id="agent-name"
              placeholder="Ej: Consultor SCM Juan García, Asesor Legal, Dr. Rodríguez..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              required
            />
            <p className="text-xs text-muted-foreground">{name.length}/60 caracteres</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-desc">Descripción breve <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea
              id="agent-desc"
              placeholder="Ej: Soy un experto en optimización de cadenas de suministro con 15 años de experiencia en manufactura y retail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{description.length}/200 caracteres</p>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={!name.trim()}>
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
