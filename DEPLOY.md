# AgentForge — Guía de Despliegue

## 1. Supabase — Ejecutar la Migración

Ve a: https://supabase.com/dashboard/project/xyanjazchhpwfacmwbgy/sql/new

Copia el contenido de `supabase/MIGRATION_COMPLETE.sql` y haz clic en **Run**.

## 2. Vercel — Importar desde GitHub

1. Ve a https://vercel.com/new
2. Importa el repo: `monrodolfo2020/monrodolfo2020`
3. Cambia la **Branch** a `agentforge`
4. Agrega las variables de entorno:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyanjazchhpwfacmwbgy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key de Supabase |
| `OPENROUTER_API_KEY` | Tu clave de openrouter.ai/keys |
| `OPENAI_API_KEY` | Tu clave de platform.openai.com |
| `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` |

5. Click **Deploy**

## 3. Post-Deploy

Después del deploy, actualiza en Supabase:
- **Authentication → URL Configuration**
  - Site URL: `https://tu-proyecto.vercel.app`
  - Redirect URLs: `https://tu-proyecto.vercel.app/auth/callback`
