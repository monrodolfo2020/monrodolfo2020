# Guía de Despliegue en Vercel

El código ya está en GitHub: https://github.com/monrodolfo2020/monrodolfo2020/tree/agentforge

---

## Paso 1 — Configurar Supabase

Antes de desplegar, necesitas tu proyecto Supabase listo.

1. Ve a https://supabase.com y crea un proyecto nuevo
2. En **Settings → API**, copia:
   - `Project URL` → tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → tu `SUPABASE_SERVICE_ROLE_KEY`
3. En **SQL Editor**, ejecuta los 3 archivos de migración EN ORDEN:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_functions.sql`
4. En **Authentication → Providers**:
   - Activa **Email**
   - Activa **Google** (agrega tus credenciales OAuth de Google Cloud)
5. En **Authentication → URL Configuration**:
   - Site URL: `https://TU-PROYECTO.vercel.app`
   - Redirect URLs: `https://TU-PROYECTO.vercel.app/auth/callback`

---

## Paso 2 — Desplegar en Vercel

1. Ve a https://vercel.com/new
2. Haz clic en **"Import Git Repository"**
3. Selecciona el repositorio: **`monrodolfo2020/monrodolfo2020`**
4. En **"Branch"**, selecciona: **`agentforge`**  
   *(Esta es la rama con el código de AgentForge)*
5. Vercel detectará automáticamente que es Next.js

---

## Paso 3 — Variables de Entorno en Vercel

En la sección **"Environment Variables"** antes de hacer Deploy, agrega:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` ⚠️ Secret |
| `OPENROUTER_API_KEY` | `sk-or-...` |
| `OPENAI_API_KEY` | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | `https://TU-PROYECTO.vercel.app` |

### ¿Cómo obtener las API Keys?

- **OpenRouter** (para los modelos de IA): https://openrouter.ai/keys
  - Gratis para empezar con Qwen 7B
- **OpenAI** (para embeddings y transcripción de audio): https://platform.openai.com/api-keys
  - Solo necesitas créditos mínimos (~$5 para empezar)

---

## Paso 4 — Deploy

Haz clic en **"Deploy"** y espera ~2 minutos.

Una vez desplegado:
1. Copia la URL de Vercel (ej: `https://agentforge-xxx.vercel.app`)
2. Actualiza la variable `NEXT_PUBLIC_APP_URL` con esa URL
3. Actualiza la **Site URL** en Supabase con esa URL
4. Re-despliega (Deployments → Redeploy)

---

## Resultado Final

Tu app estará en: `https://agentforge-xxx.vercel.app`

- `/` → Landing page
- `/register` → Crear cuenta
- `/login` → Iniciar sesión
- `/dashboard` → Gestionar agentes
- `/share/[token]` → Link público de tu agente
