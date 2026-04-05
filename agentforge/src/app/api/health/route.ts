import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

async function checkSupabase(): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await createAdminClient()
    const { error } = await admin.from('agents').select('id').limit(1)
    if (error) throw new Error(error.message)
    return { ok: true, message: 'Conectado' }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

async function checkOpenRouter(): Promise<{ ok: boolean; message: string }> {
  try {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return { ok: false, message: 'API key no configurada' }

    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401) return { ok: false, message: 'API key inv\u00e1lida' }
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    const data = await res.json()
    const credits = data?.data?.limit_remaining ?? null
    return {
      ok: true,
      message: credits !== null ? `Cr\u00e9ditos disponibles: $${Number(credits).toFixed(4)}` : 'API key v\u00e1lida',
    }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

async function checkOpenAI(): Promise<{ ok: boolean; message: string }> {
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key) return { ok: false, message: 'API key no configurada (embeddings desactivados)' }

    const res = await fetch('https://api.openai.com/v1/models?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401) return { ok: false, message: 'API key inv\u00e1lida' }
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    return { ok: true, message: 'API key v\u00e1lida (embeddings activos)' }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

export async function GET() {
  const [supabase, openrouter, openai] = await Promise.all([
    checkSupabase(),
    checkOpenRouter(),
    checkOpenAI(),
  ])

  const allOk = supabase.ok && openrouter.ok
  return NextResponse.json({ supabase, openrouter, openai }, { status: allOk ? 200 : 503 })
}
