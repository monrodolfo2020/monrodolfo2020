#!/usr/bin/env bash
# ============================================================
# setup-supabase.sh
# Vincula el proyecto Supabase, aplica migraciones y despliega
# las Edge Functions.
#
# REQUISITO: Personal Access Token de Supabase
#   1. Ve a https://supabase.com/dashboard/account/tokens
#   2. Genera un token nuevo (ej. "mall-management-cli")
#   3. Cópialo y pégalo cuando este script lo pida
#      (o expórtalo antes: export SUPABASE_ACCESS_TOKEN=sbp_...)
# ============================================================

set -euo pipefail

PROJECT_REF="xjyulrkarhuybgcgsdcp"
SUPA_URL="https://xjyulrkarhuybgcgsdcp.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqeXVscmthcmh1eWJnY2dzZGNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2OTAxMCwiZXhwIjoyMDgzMjQ1MDEwfQ.mTcgrHkbm2COzstawZug_Bc_LXuKqpaGGywjb5b3QOg"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}╔══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Mall Management — Supabase Setup   ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════╝${NC}"
echo ""

# ─── Verificar/obtener PAT ────────────────────────────────
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo -e "${YELLOW}Necesito tu Personal Access Token de Supabase.${NC}"
  echo "   → https://supabase.com/dashboard/account/tokens"
  echo -n "   Pega el token (sbp_...): "
  read -rs SUPABASE_ACCESS_TOKEN
  echo ""
fi
export SUPABASE_ACCESS_TOKEN

# ─── Verificar Supabase CLI ───────────────────────────────
if ! command -v supabase &>/dev/null; then
  echo "Instalando Supabase CLI..."
  if command -v brew &>/dev/null; then
    brew install supabase/tap/supabase
  elif command -v npm &>/dev/null; then
    npm install -g supabase
  else
    echo -e "${RED}Error: instala Supabase CLI manualmente: https://supabase.com/docs/guides/cli${NC}"
    exit 1
  fi
fi

echo -e "✓ Supabase CLI: $(supabase --version)"

# ─── Ir a la raíz del repo ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

# ─── 1. Vincular proyecto ─────────────────────────────────
echo ""
echo "1/4  Vinculando proyecto..."
supabase link --project-ref "$PROJECT_REF"
echo -e "     ${GREEN}✓ Proyecto vinculado: $PROJECT_REF${NC}"

# ─── 2. Aplicar migraciones ──────────────────────────────
echo ""
echo "2/4  Aplicando migraciones SQL (001 → 007)..."
supabase db push --project-ref "$PROJECT_REF"
echo -e "     ${GREEN}✓ Migraciones aplicadas${NC}"

# ─── 3. Desplegar Edge Functions ─────────────────────────
echo ""
echo "3/4  Desplegando Edge Functions..."
for func in supabase/functions/*/; do
  funcname=$(basename "$func")
  if [[ "$funcname" != "_shared" ]]; then
    echo -n "     → $funcname ... "
    supabase functions deploy "$funcname" --project-ref "$PROJECT_REF"
    echo -e "${GREEN}✓${NC}"
  fi
done

# ─── 4. Configurar secrets ───────────────────────────────
echo ""
echo "4/4  Configurando secrets de Edge Functions..."
supabase secrets set \
  APP_SUPABASE_URL="$SUPA_URL" \
  APP_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  --project-ref "$PROJECT_REF"
echo -e "     ${GREEN}✓ Secrets configurados${NC}"

# ─── Listo ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Setup completado exitosamente    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  Dashboard:  https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "  Tablas:     https://supabase.com/dashboard/project/${PROJECT_REF}/editor"
echo "  Functions:  https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
echo ""
echo "  Próximos pasos:"
echo "  1. cd apps/web && cp ../../.env.example .env.local (ya creado)"
echo "  2. pnpm --filter @mall/web dev"
echo ""
