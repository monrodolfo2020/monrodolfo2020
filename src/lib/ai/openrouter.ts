import { createOpenAI } from '@ai-sdk/openai'

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AgentForge',
  },
})

export const AI_MODELS = [
  {
    id: 'qwen/qwen-2.5-7b-instruct:free',
    name: 'Básico — Sin costo',
    description: 'Perfecto para empezar. Buena calidad sin ningún costo.',
    badge: 'Gratis',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Estándar — ~$0.30 por 1,000 respuestas',
    description: 'Mejor comprensión de preguntas complejas. Ideal para uso profesional.',
    badge: 'Popular',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Premium — ~$0.50 por 1,000 respuestas',
    description: 'La mejor calidad disponible. Excelente para consultores y expertos.',
    badge: 'Premium',
  },
]
