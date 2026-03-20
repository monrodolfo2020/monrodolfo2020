#!/usr/bin/env node
/**
 * create-demo-user.mjs
 *
 * Crea el usuario administrador demo en Supabase Auth y su perfil.
 *
 * Uso:
 *   node scripts/create-demo-user.mjs
 *
 * Variables requeridas en apps/web/.env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../apps/web/.env.local')

// Carga variables de entorno manualmente
const envVars = {}
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) envVars[key.trim()] = rest.join('=').trim()
  }
} catch {
  console.error('❌  No se encontró apps/web/.env.local')
  process.exit(1)
}

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']
const DEMO_MALL_ID = '00000000-0000-0000-0000-000000000001'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
}

async function createUser(email, password, fullName, role) {
  console.log(`\n→ Creando usuario: ${email} (${role})`)

  // 1. Crear en Auth
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  })

  const authData = await authRes.json()

  if (!authRes.ok) {
    if (authData.message?.includes('already registered') || authData.code === 'email_exists') {
      console.log(`  ℹ️  Usuario ya existe, buscando ID...`)
      // Buscar usuario existente
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`, {
        headers,
      })
      const listData = await listRes.json()
      const existing = listData.users?.find((u) => u.email === email)
      if (existing) {
        authData.id = existing.id
        console.log(`  ✔  Encontrado: ${existing.id}`)
      } else {
        console.error(`  ❌  No se pudo obtener el usuario existente`)
        return
      }
    } else {
      console.error(`  ❌  Auth error: ${authData.message || JSON.stringify(authData)}`)
      return
    }
  } else {
    console.log(`  ✔  Auth user creado: ${authData.id}`)
  }

  const userId = authData.id

  // 2. Insertar / actualizar perfil
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      mall_id: DEMO_MALL_ID,
      full_name: fullName,
      role,
      is_active: true,
    }),
  })

  if (profileRes.ok || profileRes.status === 201 || profileRes.status === 200) {
    console.log(`  ✔  Perfil creado/actualizado`)
  } else {
    const errText = await profileRes.text()
    console.error(`  ❌  Error perfil: ${errText}`)
  }
}

// ─── Usuarios demo ────────────────────────────────────────────────────────────
const users = [
  { email: 'admin@demo.com',       password: 'Admin1234!',    name: 'Admin Demo',        role: 'mall_admin' },
  { email: 'jefe@demo.com',        password: 'Maint1234!',    name: 'Jefe Mantenimiento', role: 'maintenance_chief' },
  { email: 'operador@demo.com',    password: 'Oper1234!',     name: 'Operador Demo',     role: 'maintenance_operator' },
  { email: 'guardia@demo.com',     password: 'Guard1234!',    name: 'Guardia Demo',      role: 'security_guard' },
]

console.log('╔══════════════════════════════════════════════╗')
console.log('║   Mall Management — Crear Usuarios Demo      ║')
console.log('╚══════════════════════════════════════════════╝')
console.log(`\n📡 Proyecto: ${SUPABASE_URL}`)
console.log(`🏢 Mall ID:  ${DEMO_MALL_ID}\n`)

for (const u of users) {
  await createUser(u.email, u.password, u.name, u.role)
}

console.log('\n╔══════════════════════════════════════════════╗')
console.log('║  Usuarios demo listos                        ║')
console.log('╠══════════════════════════════════════════════╣')
console.log('║  admin@demo.com       → Admin1234!           ║')
console.log('║  jefe@demo.com        → Maint1234!           ║')
console.log('║  operador@demo.com    → Oper1234!            ║')
console.log('║  guardia@demo.com     → Guard1234!           ║')
console.log('╠══════════════════════════════════════════════╣')
console.log('║  → pnpm dev (en apps/web)                    ║')
console.log('║  → Abre http://localhost:3000                ║')
console.log('╚══════════════════════════════════════════════╝\n')
