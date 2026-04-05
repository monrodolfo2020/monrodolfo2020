import { AgentWizard } from '@/components/agents/AgentWizard'

export default function NewAgentPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Crear nuevo agente</h1>
        <p className="text-muted-foreground">Tu agente de IA personalizado en 3 sencillos pasos</p>
      </div>
      <AgentWizard />
    </div>
  )
}
