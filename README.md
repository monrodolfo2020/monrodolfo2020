# Mall Management SAAS Platform

Sistema integral de gestión operativa para centros comerciales: mantenimiento, seguridad, inventario y scoring en tiempo real.

---

## Arquitectura

```
monorepo (pnpm workspaces + Turborepo)
├── apps/
│   ├── web/          Next.js 14 App Router — Dashboard web admin
│   └── mobile/       Expo (React Native) — App para operadores
├── packages/
│   ├── types/        Tipos TypeScript compartidos
│   ├── scoring/      Motor de cálculo de puntajes
│   ├── validators/   Esquemas Zod de validación
│   └── ui/           Tokens de diseño compartidos
└── supabase/
    ├── migrations/   Migraciones SQL (001–007)
    ├── functions/    Deno Edge Functions
    ├── seed.sql      Datos iniciales de prueba
    └── config.toml   Configuración local Supabase
```

---

## Stack Tecnológico

| Capa          | Tecnología                                        |
|---------------|---------------------------------------------------|
| Backend       | Supabase (PostgreSQL 15, Auth, Storage, Realtime) |
| Edge Functions| Deno (Supabase Edge Runtime)                      |
| Web           | Next.js 14, Tailwind CSS, Supabase SSR            |
| Mobile        | Expo 51, React Native, expo-camera, expo-location |
| Monorepo      | pnpm workspaces, Turborepo                        |
| Deploy Web    | Vercel (con Cron Jobs de respaldo)                |
| Deploy Mobile | EAS Build (Expo Application Services)             |

---

## Requisitos Previos

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Expo CLI (`npm i -g expo-cli eas-cli`)
- Cuenta en [Supabase](https://supabase.com) (Free o Pro)
- Cuenta en [Vercel](https://vercel.com)

---

## Configuración Local

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url> mall-management
cd mall-management
pnpm install
```

### 2. Variables de entorno

**Web (`apps/web/.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_WEBHOOK_SECRET=<webhook-secret-random-string>
CRON_SECRET=<cron-secret-random-string>
```

**Mobile (`apps/mobile/.env`):**

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Supabase — Iniciar entorno local

```bash
supabase start          # Levanta PostgreSQL + Studio + Auth local
supabase db reset       # Aplica migraciones + seed.sql
supabase status         # Muestra URLs y claves locales
```

URLs locales:
- Studio: http://127.0.0.1:54323
- API:    http://127.0.0.1:54321
- DB:     postgresql://postgres:postgres@127.0.0.1:54322/postgres

### 4. Levantar el dashboard web

```bash
pnpm --filter @mall/web dev
# http://localhost:3000
```

### 5. Levantar la app móvil

```bash
pnpm --filter @mall/mobile start
# Escanea el QR con Expo Go, o presiona 'a' para Android / 'i' para iOS simulator
```

---

## Supabase — Proyecto en Producción

### Crear proyecto

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Guardar la URL, anon key y service role key

### Aplicar migraciones

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### Edge Functions — Deploy

```bash
supabase functions deploy generate-qr
supabase functions deploy verify-scan
supabase functions deploy generate-daily-tasks
supabase functions deploy calculate-scores
supabase functions deploy process-csv-import
```

### Secrets para Edge Functions

```bash
supabase secrets set APP_SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set APP_SERVICE_ROLE_KEY=<service-role-key>
```

### Storage — Buckets

Los buckets se crean automáticamente con la migración `004_storage_buckets.sql`.

| Bucket           | Acceso  | Límite | Uso                            |
|------------------|---------|--------|--------------------------------|
| `mall-media`     | Privado | 50 MB  | Fotos de tareas y hallazgos    |
| `mall-documents` | Privado | 20 MB  | CSVs de inventario, SOPs       |
| `mall-logos`     | Público |  5 MB  | Logos de malls                 |
| `qr-codes`       | Privado |  2 MB  | Imágenes QR de checkpoints     |

### Cron Jobs

Con Supabase Pro (pg_cron disponible) las tareas se ejecutan automáticamente.

Con el plan Free, los cron jobs se ejecutan desde **Vercel Cron Jobs** (configurados en `vercel.json`):

| Job                         | Horario        | Descripción                          |
|-----------------------------|----------------|--------------------------------------|
| `/api/cron/generate-tasks`  | `0 1 * * *`    | Genera tareas del día desde plantillas|
| `/api/cron/calculate-scores`| `45 23 * * *`  | Calcula puntaje diario               |
| `/api/cron/calculate-scores?period=weekly` | `55 23 * * 0` | Puntaje semanal |
| `/api/cron/calculate-scores?period=monthly`| `58 23 28-31 * *` | Puntaje mensual |

### Realtime

Las siguientes tablas emiten cambios en tiempo real:

- `patrol_sessions` — estado de rondas activas
- `checkpoint_scans` — scans de QR en vivo
- `maintenance_tasks` — actualizaciones de tareas
- `findings` — nuevos hallazgos
- `inventory_items` — cambios de stock
- `score_snapshots` — nuevos puntajes calculados

### Webhooks

Configurar en Supabase Dashboard > Database > Webhooks:

| Tabla                   | Evento | Destino                                   |
|-------------------------|--------|-------------------------------------------|
| `inventory_import_jobs` | INSERT | `https://tu-dominio.vercel.app/api/webhooks/supabase` |
| `score_snapshots`       | INSERT | `https://tu-dominio.vercel.app/api/webhooks/supabase` |

Header: `x-supabase-signature: sha256=<SUPABASE_WEBHOOK_SECRET>`

---

## Deploy en Vercel

### 1. Conectar repositorio

```bash
vercel --prod
```

### 2. Variables de entorno en Vercel

Agregar en Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_WEBHOOK_SECRET
CRON_SECRET
```

### 3. Cron Jobs

Los cron jobs se activan automáticamente desde `vercel.json`. Requieren plan Vercel Pro para más de un cron job.

---

## Deploy Mobile con EAS

### 1. Configurar cuenta

```bash
eas login
eas build:configure
```

### 2. Build de desarrollo

```bash
eas build --profile development --platform android
```

### 3. Build de producción

```bash
eas build --profile production --platform all
eas submit --profile production
```

---

## Migraciones SQL — Resumen

| Archivo                        | Contenido                                          |
|--------------------------------|----------------------------------------------------|
| `001_initial_schema.sql`       | Tablas principales, índices, triggers updated_at   |
| `002_rls_policies.sql`         | Row Level Security para multi-tenant              |
| `003_auth_hooks.sql`           | Hook para crear user_profile tras registro        |
| `004_storage_buckets.sql`      | Buckets S3, políticas de acceso por mall          |
| `005_cron_jobs.sql`            | pg_cron: tareas, scores, limpieza automática      |
| `006_rpc_functions.sql`        | RPCs: sync, dashboard, scoring, alertas           |
| `007_realtime.sql`             | Publicación Realtime de tablas operativas         |

---

## Roles de Usuario

| Rol                    | Permisos                                                          |
|------------------------|-------------------------------------------------------------------|
| `super_admin`          | Acceso total a todos los malls                                   |
| `mall_admin`           | Gestión completa de su mall                                      |
| `maintenance_chief`    | Valida tareas, gestiona plantillas de su mall                    |
| `maintenance_operator` | Completa tareas asignadas, reporta hallazgos                     |
| `security_guard`       | Realiza rondas, escanea QR, reporta incidentes                   |
| `viewer`               | Solo lectura del dashboard                                       |

---

## Módulos Principales

### Mantenimiento
- Plantillas de actividades con frecuencia configurable
- Generación automática de tareas diarias (Edge Function)
- Completado con fotos desde app móvil
- Validación por jefe de mantenimiento
- Scoring por puntualidad y completitud

### Seguridad
- Rutas de patrullaje con secuencia de checkpoints
- Generación de QR firmados con HMAC-SHA256
- Verificación de geolocalización (geofence)
- Dashboard de rondas en tiempo real (Supabase Realtime)
- Historial de scans con mapa de cobertura

### Inventario
- Catálogo de artículos con stock mínimo/máximo
- Movimientos de stock vinculados a tareas
- Importación masiva via CSV (Storage → Edge Function)
- Alertas de stock bajo

### Scoring
- 5 dimensiones ponderables por mall
- Snapshots diarios/semanales/mensuales
- Gráfica de tendencia en el dashboard
- Comparativa entre períodos

---

## Estructura de Carpetas (Web)

```
apps/web/
├── app/
│   ├── (auth)/login/         Página de inicio de sesión
│   ├── (dashboard)/
│   │   ├── layout.tsx        Shell con sidebar
│   │   ├── [mallId]/
│   │   │   ├── overview/     Resumen y KPIs
│   │   │   ├── maintenance/  Tareas de mantenimiento
│   │   │   ├── security/     Rondas y sesiones
│   │   │   │   └── checkpoints/ Gestión de QRs
│   │   │   ├── inventory/    Inventario y stock
│   │   │   ├── findings/     Hallazgos y no conformidades
│   │   │   ├── reports/      Reportes PDF/Excel
│   │   │   ├── users/        Gestión del equipo
│   │   │   └── settings/     Configuración del mall
│   │   └── super-admin/      Panel global multi-mall
│   ├── api/
│   │   ├── webhooks/supabase/ Receptor de webhooks
│   │   ├── cron/             Endpoints de Vercel Cron
│   │   └── admin/invite-user/ Invitación de usuarios
│   └── page.tsx              Redirect a dashboard
├── components/
│   ├── auth/                 Formularios de autenticación
│   └── dashboard/            Widgets del dashboard
└── lib/
    ├── supabase/             Clientes SSR/CSR/Middleware
    ├── hooks/                Hooks de datos
    └── utils/                Utilidades
```

---

## Licencia

Propietario — Todos los derechos reservados.
