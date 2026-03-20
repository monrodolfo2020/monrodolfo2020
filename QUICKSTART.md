# Mall Management — Inicio Rápido

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm i -g pnpm` |
| Supabase CLI | última | `brew install supabase/tap/supabase` |

---

## 1. Instalar dependencias

```bash
pnpm install
```

---

## 2. Aplicar migraciones a Supabase

```bash
# Iniciar sesión en Supabase (solo la primera vez)
supabase login

# Aplicar todas las migraciones (001 → 008)
./scripts/run-migrations.sh
```

> Las migraciones crean: tablas, RLS policies, hooks de autenticación,
> storage buckets, cron jobs, funciones RPC y datos demo.

---

## 3. Desplegar Edge Functions

```bash
./scripts/deploy-functions.sh
```

Funciones desplegadas:
- `generate-qr` — genera payload firmado HMAC para QR de checkpoints
- `verify-scan` — verifica QR + geolocalización desde la app móvil
- `process-csv-import` — procesa importación masiva de inventario
- `generate-daily-tasks` — genera tareas diarias desde plantillas
- `calculate-scores` — calcula puntuaciones diarias/semanales/mensuales

---

## 4. Crear usuarios demo

```bash
node scripts/create-demo-user.mjs
```

Crea 4 usuarios en Supabase Auth con perfiles vinculados al mall demo:

| Email | Contraseña | Rol |
|---|---|---|
| admin@demo.com | Admin1234! | mall_admin |
| jefe@demo.com | Maint1234! | maintenance_chief |
| operador@demo.com | Oper1234! | maintenance_operator |
| guardia@demo.com | Guard1234! | security_guard |

---

## 5. Levantar la app web

```bash
cd apps/web
pnpm dev
```

Abre **http://localhost:3000** e inicia sesión con `admin@demo.com`.

---

## 6. Levantar la app móvil

```bash
cd apps/mobile
pnpm start
```

Escanea el QR con **Expo Go** en tu teléfono.

---

## 7. Probar la importación de inventario CSV

1. Entra a **Inventario → Importar CSV**
2. Descarga el archivo de muestra: [`inventory_import_sample.csv`](/docs/inventory_import_sample.csv)
3. Carga el archivo y confirma la importación

---

## Estructura del proyecto

```
monrodolfo2020/
├── apps/
│   ├── web/          # Next.js 15 — Dashboard web
│   └── mobile/       # Expo 52 — App móvil (guardia/operador)
├── packages/
│   ├── types/        # Tipos TypeScript compartidos
│   ├── validators/   # Esquemas Zod compartidos
│   └── scoring/      # Motor de puntuación compartido
├── supabase/
│   ├── migrations/   # 001-008 SQL migrations
│   └── functions/    # Edge Functions Deno
├── docs/             # Documentación y archivos de ejemplo
└── scripts/          # Scripts de setup y deploy
```

---

## Variables de entorno

Las variables ya están configuradas en `apps/web/.env.local`. Si necesitas
crear un nuevo entorno, copia `apps/web/.env.example` y completa los valores.
