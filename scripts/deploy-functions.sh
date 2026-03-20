#!/usr/bin/env bash
# =============================================================================
# deploy-functions.sh — Despliega las Edge Functions a Supabase
# =============================================================================
# Requisitos:
#   - supabase CLI instalado
#   - SUPABASE_ACCESS_TOKEN en el entorno o en apps/web/.env.local
#   - Ya hayas corrido: supabase login
#
# Uso:
#   chmod +x scripts/deploy-functions.sh
#   ./scripts/deploy-functions.sh
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

# Carga .env.local
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

[[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]] && fail "NEXT_PUBLIC_SUPABASE_URL no definido"

PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%.supabase.co}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Desplegando Edge Functions                  ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Proyecto: $PROJECT_REF"
echo ""

command -v supabase >/dev/null 2>&1 || fail "supabase CLI no encontrado"

cd "$ROOT_DIR"

FUNCTIONS=(
  "generate-qr"
  "verify-scan"
  "process-csv-import"
  "generate-daily-tasks"
  "calculate-scores"
)

for fn in "${FUNCTIONS[@]}"; do
  echo -n "  → Desplegando $fn... "
  supabase functions deploy "$fn" \
    --project-ref "$PROJECT_REF" \
    && ok "OK" || warn "FALLÓ (ver error arriba)"
done

echo ""
ok "Despliegue completado"
