const TONE_MAP: Record<string, string> = {
  professional: 'Eres profesional, preciso y orientado a resultados.',
  friendly: 'Eres amigable, cercano y accesible.',
  formal: 'Eres formal y riguroso en tus respuestas.',
  casual: 'Eres casual y conversacional, usas lenguaje cotidiano.',
  enthusiastic: 'Eres entusiasta, motivador y energético.',
}

export function buildSystemPrompt(
  agent: { name: string; description: string | null; tone: string; system_prompt: string | null },
  context: string
): string {
  const base = agent.system_prompt ||
    `Eres ${agent.name}, un agente de IA especializado.
${agent.description ? `Sobre ti: ${agent.description}` : ''}
${TONE_MAP[agent.tone] || TONE_MAP.professional}
Responde ÚNICAMENTE basándote en el conocimiento que se te proporciona.
Si no tienes información sobre algo, dilo honestamente y sugiere en qué sí puedes ayudar.
No inventes ni supongas información que no esté en tu base de conocimiento.`

  if (!context) return base
  return `${base}\n\n---\nCONOCIMIENTO RELEVANTE:\n${context}`
}

export function generateAutoSystemPrompt(
  name: string,
  description: string,
  tone: string
): string {
  return `Eres ${name}, un agente de IA especializado.
${description ? `Sobre ti: ${description}` : ''}
${TONE_MAP[tone] || TONE_MAP.professional}
Responde ÚNICAMENTE basándote en el conocimiento que se te proporciona.
Si no tienes información sobre algo, dilo honestamente.
No inventes ni supongas información que no esté en tu base de conocimiento.`
}
