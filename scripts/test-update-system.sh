#!/bin/bash
# Script de teste para o sistema de atualização
# Verifica se todos os componentes estão funcionando

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

BASE_URL="http://localhost:8001"
PASS_COUNT=0
FAIL_COUNT=0

# Função para testar endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    local description="$3"
    
    info "🧪 Testando: $description"
    info "📡 Endpoint: $endpoint"
    
    local response
    local http_code
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint" || echo "ERROR")
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$response" = "ERROR" ]; then
        error "❌ Falha na conexão"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
    
    if [ "$http_code" = "$expected_status" ]; then
        log "✅ Status: $http_code ✓"
        if [ "$response_body" != "" ]; then
            info "📄 Response: $response_body"
        fi
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        error "❌ Status esperado: $expected_status, recebido: $http_code"
        if [ "$response_body" != "" ]; then
            error "📄 Response: $response_body"
        fi
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Função para verificar se versão está sendo exibida no HTML
test_version_in_html() {
    info "🧪 Verificando se badge de versão está presente no HTML"
    
    local html_response
    html_response=$(curl -s "$BASE_URL/" || echo "ERROR")
    
    if [ "$html_response" = "ERROR" ]; then
        error "❌ Falha ao obter HTML principal"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
    
    if echo "$html_response" | grep -q "version-badge"; then
        log "✅ Badge de versão presente no HTML"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        error "❌ Badge de versão não encontrado no HTML"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
    
    if echo "$html_response" | grep -q "update-modal"; then
        log "✅ Modal de atualização presente no HTML"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        error "❌ Modal de atualização não encontrado no HTML"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Função para verificar arquivos necessários
test_required_files() {
    info "🧪 Verificando arquivos necessários do sistema"
    
    local files=(
        "server/services/updateService.js"
        "server/services/installService.js"
        "server/routes/updates.js"
        "scripts/setup-git.sh"
        "release-templates/create-release.sh"
        "release-templates/update-manifest.json"
        "release-templates/pre-update.sh"
        "release-templates/post-update.sh"
        "SISTEMA_ATUALIZACAO.md"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log "✅ Arquivo presente: $file"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            error "❌ Arquivo ausente: $file"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    done
}

# Função para verificar permissões dos scripts
test_script_permissions() {
    info "🧪 Verificando permissões dos scripts"
    
    local scripts=(
        "scripts/setup-git.sh"
        "release-templates/create-release.sh"
        "release-templates/pre-update.sh"
        "release-templates/post-update.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -x "$script" ]; then
            log "✅ Script executável: $script"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            error "❌ Script não executável: $script"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    done
}

# Função principal de testes
main() {
    log "🚀 Iniciando testes do sistema de atualização..."
    log "🌐 Base URL: $BASE_URL"
    
    echo
    info "=== TESTE 1: ENDPOINTS BÁSICOS ==="
    test_endpoint "/health" "200" "Health check"
    test_endpoint "/api/status/version" "200" "Endpoint de versão"
    
    echo
    info "=== TESTE 2: ENDPOINTS DE ATUALIZAÇÃO (sem autenticação) ==="
    test_endpoint "/api/updates/check" "401" "Verificação de updates (deve exigir auth)"
    test_endpoint "/api/updates/requirements" "401" "Requisitos de updates (deve exigir auth)"
    test_endpoint "/api/updates/status" "401" "Status de updates (deve exigir auth)"
    
    echo
    info "=== TESTE 3: INTERFACE WEB ==="
    test_version_in_html
    
    echo
    info "=== TESTE 4: ARQUIVOS DO SISTEMA ==="
    test_required_files
    
    echo
    info "=== TESTE 5: PERMISSÕES DE SCRIPTS ==="
    test_script_permissions
    
    echo
    info "=== TESTE 6: SISTEMA GIT ==="
    if ./scripts/setup-git.sh >/dev/null 2>&1; then
        log "✅ Sistema Git funcional"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        error "❌ Sistema Git com problemas"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo
    info "=== TESTE 7: CRIAÇÃO DE DIRETÓRIOS ==="
    local dirs=("logs" "backups" "temp")
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ] || mkdir -p "$dir" 2>/dev/null; then
            log "✅ Diretório OK: $dir"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            error "❌ Problema com diretório: $dir"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    done
    
    # Relatório final
    echo
    info "=== RELATÓRIO FINAL ==="
    log "✅ Testes aprovados: $PASS_COUNT"
    
    if [ $FAIL_COUNT -gt 0 ]; then
        error "❌ Testes falharam: $FAIL_COUNT"
        warning "⚠️ Sistema pode não funcionar corretamente"
        exit 1
    else
        log "🎉 Todos os testes passaram!"
        log "✅ Sistema de atualização está funcionando corretamente"
        log ""
        log "🎯 PRÓXIMOS PASSOS PARA USAR O SISTEMA:"
        log "1. Acesse http://localhost:8001 no navegador"
        log "2. O badge de versão aparecerá no canto inferior direito"
        log "3. Para criar releases, use: ./release-templates/create-release.sh"
        log "4. Consulte SISTEMA_ATUALIZACAO.md para documentação completa"
        exit 0
    fi
}

# Executar testes
main "$@"