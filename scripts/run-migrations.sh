#!/usr/bin/env bash
# =============================================================================
# run-migrations.sh — Aplica todas las migraciones SQL al proyecto Supabase
# =============================================================================
# Uso:
#   chmod +x scripts/run-migrations.sh
#   ./scripts/run-migrations.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
ok()   { echo -e "${GREEN}✔  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠  $*${NC}"; }
fail() { echo -e "${RED}✖  $*${NC}"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/web/.env.local"

if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

[[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]] && fail "NEXT_PUBLIC_SUPABASE_URL no definido"
[[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && fail "SUPABASE_SERVICE_ROLE_KEY no definido"

PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%.supabase.co}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Aplicando Migraciones SQL                   ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Proyecto: $PROJECT_REF"
echo ""

command -v supabase >/dev/null 2>&1 || fail "supabase CLI no encontrado"

cd "$ROOT_DIR"

# Vincula el proyecto (silencioso si ya está vinculado)
supabase link --project-ref "$PROJECT_REF" 2>/dev/null || true

echo "  Aplicando todas las migraciones..."
supabase db push

ok "Migraciones aplicadas correctamente"

echo ""
echo "  Para aplicar solo el seed demo:"
echo "  supabase db execute --file supabase/migrations/008_seed_demo.sql"
echo ""
