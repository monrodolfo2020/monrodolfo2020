import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ac.signal })
  } finally {
    clearTimeout(timer)
  }
}

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
    const res = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/auth/key',
      { headers: { Authorization: `Bearer ${key}` } },
      8000
    )
    if (res.status === 401) return { ok: false, message: 'API key invalida' }
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    const data = await res.json() as { data?: { limit_remaining?: number } }
    const credits = data?.data?.limit_remaining ?? null
    return {
      ok: true,
      message: credits !== null ? `Creditos disponibles: $${Number(credits).toFixed(4)}` : 'API key valida',
    }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

async function checkOpenAI(): Promise<{ ok: boolean; message: string }> {
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key) return { ok: false, message: 'API key no configurada' }
    const res = await fetchWithTimeout(
      'https://api.openai.com/v1/models?limit=1',
      { headers: { Authorization: `Bearer ${key}` } },
      8000
    )
    if (res.status === 401) return { ok: false, message: 'API key invalida' }
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    return { ok: true, message: 'API key valida' }
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
