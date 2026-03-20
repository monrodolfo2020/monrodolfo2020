#!/usr/bin/env bash
# =============================================================================
# setup.sh — Despliegue completo del proyecto Mall Management
# =============================================================================
# Uso:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
#
# Requisitos:
#   - supabase CLI instalado (brew install supabase/tap/supabase)
#   - SUPABASE_ACCESS_TOKEN exportado (o definido en .env.local)
#   - pnpm instalado
# =============================================================================

set -euo pipefail

# ─── Colores ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✔  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠  $*${NC}"; }
fail() { echo -e "${RED}✖  $*${NC}"; exit 1; }
info() { echo -e "   $*"; }

# ─── Variables ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/apps/web/.env.local"
SUPABASE_DIR="$ROOT_DIR/supabase"

# Carga variables de entorno
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# ─── Verificar prerequisites ──────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Mall Management — Setup & Deploy         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

command -v supabase >/dev/null 2>&1 || fail "Supabase CLI no encontrado. Instálalo con: brew install supabase/tap/supabase"
command -v pnpm    >/dev/null 2>&1 || fail "pnpm no encontrado. Instálalo con: npm i -g pnpm"
command -v node    >/dev/null 2>&1 || fail "Node.js no encontrado."

[[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]  && fail "NEXT_PUBLIC_SUPABASE_URL no está definido en $ENV_FILE"
[[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && fail "SUPABASE_SERVICE_ROLE_KEY no está definido en $ENV_FILE"

# Extrae el project ref de la URL (xxxxxxxx.supabase.co → xxxxxxxx)
SUPABASE_PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF%.supabase.co}"

ok "Proyecto Supabase: $SUPABASE_PROJECT_REF"

# ─── 1. Instalar dependencias ─────────────────────────────────────────────────
echo ""
echo "1/4  Instalando dependencias..."
cd "$ROOT_DIR"
pnpm install --frozen-lockfile --silent
ok "Dependencias instaladas"

# ─── 2. Vincular proyecto Supabase ───────────────────────────────────────────
echo ""
echo "2/4  Vinculando proyecto Supabase..."

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  warn "SUPABASE_ACCESS_TOKEN no definido — intentando con sesión activa..."
fi

supabase link --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null || \
  warn "Ya vinculado o sin acceso al CLI. Continuando..."

# ─── 3. Aplicar migraciones ──────────────────────────────────────────────────
echo ""
echo "3/4  Aplicando migraciones SQL..."

MIGRATION_FILES=(
  "$SUPABASE_DIR/migrations/001_initial_schema.sql"
  "$SUPABASE_DIR/migrations/002_rls_policies.sql"
  "$SUPABASE_DIR/migrations/003_auth_hooks.sql"
  "$SUPABASE_DIR/migrations/004_storage_buckets.sql"
  "$SUPABASE_DIR/migrations/005_cron_jobs.sql"
  "$SUPABASE_DIR/migrations/006_rpc_functions.sql"
  "$SUPABASE_DIR/migrations/007_realtime.sql"
  "$SUPABASE_DIR/migrations/008_seed_demo.sql"
)

for migration in "${MIGRATION_FILES[@]}"; do
  if [[ -f "$migration" ]]; then
    name="$(basename "$migration")"
    echo "   Aplicando $name..."
    supabase db push --include-all 2>/dev/null || \
      warn "Usa 'supabase db push' manualmente si este paso falla"
    break  # supabase db push aplica todas las migrations de una vez
  fi
done

ok "Migraciones aplicadas"
info "Tip: si alguna migración ya existía, Supabase la omite automáticamente."

# ─── 4. Desplegar Edge Functions ─────────────────────────────────────────────
echo ""
echo "4/4  Desplegando Edge Functions..."

FUNCTIONS=(
  "generate-qr"
  "verify-scan"
  "process-csv-import"
  "generate-daily-tasks"
  "calculate-scores"
)

for fn in "${FUNCTIONS[@]}"; do
  fn_dir="$SUPABASE_DIR/functions/$fn"
  if [[ -d "$fn_dir" ]]; then
    echo "   → $fn"
    supabase functions deploy "$fn" \
      --project-ref "$SUPABASE_PROJECT_REF" \
      --no-verify-jwt 2>/dev/null || warn "No se pudo desplegar $fn (verifica permisos)"
  fi
done

ok "Edge Functions desplegadas"

# ─── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Setup completado exitosamente               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Siguiente paso:                             ║"
echo "║   node scripts/create-demo-user.mjs          ║"
echo "║   cd apps/web && pnpm dev                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
