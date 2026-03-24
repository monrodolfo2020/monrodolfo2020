# Contexto del Proyecto Mall Manager

## Repositorio en GitHub

**URL del repositorio:**
```
https://github.com/monrodolfo2020/monrodolfo2020
```

**Rama principal de desarrollo:**
```
master
```

**Rama de Claude (desarrollo activo):**
```
claude/mall-management-system-S8V3A
```

> IMPORTANTE: La app de inglés que apareció por error está en la rama `claude/english-learning-songs-app-z4jT0`. No confundirlas.

---

## Cómo clonar en tu PC (carpeta "Mall Manager" en el Escritorio)

```bash
cd Desktop
mkdir "Mall Manager"
cd "Mall Manager"
git clone https://github.com/monrodolfo2020/monrodolfo2020 .
pnpm install
```

---

## Estructura del Proyecto

```
apps/
  web/          → Aplicación Next.js 15 principal
packages/
  scoring/      → Lógica de puntuación
  types/        → Tipos TypeScript compartidos
  validators/   → Validadores Zod
supabase/       → Migraciones y configuración de base de datos
vercel.json     → Configuración de deploy en Vercel
turbo.json      → Configuración Turborepo (monorepo)
pnpm-workspace.yaml
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 + React 19 |
| Estilos | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Estado | Zustand + TanStack Query |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel |
| Validación | Zod |
| Reportes | @react-pdf/renderer |

---

## Comandos principales

```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm dev

# Build para producción
pnpm build

# Lint
pnpm lint

# Type check
pnpm type-check
```

---

## Configuración de Vercel (ya configurada en vercel.json)

| Campo | Valor |
|---|---|
| Framework | Next.js |
| Build Command | `cd apps/web && pnpm build` |
| Output Directory | `apps/web/.next` |
| Install Command | `pnpm install` |

### Crons automáticos configurados:
- `0 1 * * *` → Genera tareas diarias
- `45 23 * * *` → Calcula scores diarios
- `55 23 * * 0` → Calcula scores semanales
- `58 23 28-31 * *` → Calcula scores mensuales

---

## Variables de entorno necesarias en Vercel

Agregar en Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Obtenerlas en: **supabase.com** → Tu proyecto → Settings → API

---

## Pasos para desplegar en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Sign Up con GitHub
3. "Add New Project" → importar repo `monrodolfo2020/monrodolfo2020`
4. Verificar que detecta: Framework = Next.js
5. Agregar las 3 variables de entorno de Supabase
6. Clic en "Deploy"

---

## Historial reciente de commits

```
1b7ee5e chore(setup): add scripts, quickstart guide and fix import page
2b96ac8 feat(inventory): add CSV import flow and demo seed data
ea6b4fc fix: resolve all type-check and lint errors across monorepo
93ec5eb fix(ci): sync pnpm version to 10.29.3 to match package.json
f448c93 fix: correct supabase db push command flags
```

---

## Instrucciones para Claude Desktop

Al abrir este proyecto en Claude Desktop:

1. Abrir Claude Desktop
2. Clic en el ícono de carpeta → seleccionar la carpeta "Mall Manager"
3. Claude detectará automáticamente la estructura del proyecto
4. Puedes pedirle que continúe el desarrollo desde donde quedó

**Rama activa de desarrollo:** `claude/mall-management-system-S8V3A`

Para continuar en esa rama:
```bash
git checkout claude/mall-management-system-S8V3A
```

---

*Documento generado el 24 de marzo de 2026 desde Claude Code Web*
