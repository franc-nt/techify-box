#!/bin/bash
# Script para verificar e instalar Git na VM
# Pode ser executado independentemente ou como parte do sistema de updates

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

# Função para verificar se Git está instalado
check_git_installed() {
    if command -v git >/dev/null 2>&1; then
        local git_version=$(git --version)
        log "✅ Git já está instalado: $git_version"
        return 0
    else
        warning "❌ Git não está instalado"
        return 1
    fi
}

# Função para instalar Git
install_git() {
    log "🔄 Instalando Git..."
    
    # Detectar distribuição Linux
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        log "📦 Detectado sistema Debian/Ubuntu"
        
        # Atualizar lista de pacotes
        apt-get update -qq
        
        # Instalar Git
        apt-get install -y git
        
    elif [ -f /etc/redhat-release ]; then
        # RedHat/CentOS/Fedora
        log "📦 Detectado sistema RedHat/CentOS/Fedora"
        
        if command -v dnf >/dev/null 2>&1; then
            dnf install -y git
        elif command -v yum >/dev/null 2>&1; then
            yum install -y git
        else
            error "Gerenciador de pacotes não encontrado"
            return 1
        fi
        
    elif [ -f /etc/alpine-release ]; then
        # Alpine Linux
        log "📦 Detectado sistema Alpine Linux"
        apk add --no-cache git
        
    else
        # Tentar com ferramentas genéricas
        warning "Sistema não identificado, tentando instalação genérica..."
        
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y git
        elif command -v yum >/dev/null 2>&1; then
            yum install -y git
        elif command -v apk >/dev/null 2>&1; then
            apk add --no-cache git
        else
            error "Não foi possível instalar Git automaticamente"
            error "Por favor, instale Git manualmente:"
            error "  - Debian/Ubuntu: sudo apt-get install git"
            error "  - CentOS/RHEL: sudo yum install git"
            error "  - Alpine: apk add git"
            return 1
        fi
    fi
    
    # Verificar se a instalação foi bem-sucedida
    if command -v git >/dev/null 2>&1; then
        local git_version=$(git --version)
        log "✅ Git instalado com sucesso: $git_version"
        return 0
    else
        error "❌ Falha ao instalar Git"
        return 1
    fi
}

# Função para configurar Git básico
configure_git() {
    log "🔧 Configurando Git básico..."
    
    # Verificar se já há configuração global
    local user_name=$(git config --global user.name 2>/dev/null || echo "")
    local user_email=$(git config --global user.email 2>/dev/null || echo "")
    
    if [ -z "$user_name" ]; then
        log "⚙️ Configurando nome de usuário padrão..."
        git config --global user.name "Techify Box System"
        log "✅ Nome configurado: Techify Box System"
    else
        log "✅ Nome já configurado: $user_name"
    fi
    
    if [ -z "$user_email" ]; then
        log "⚙️ Configurando email padrão..."
        git config --global user.email "system@techify.box"
        log "✅ Email configurado: system@techify.box"
    else
        log "✅ Email já configurado: $user_email"
    fi
    
    # Configurar opções de segurança para repositórios
    git config --global --add safe.directory /opt/techify-box 2>/dev/null || true
    git config --global init.defaultBranch main 2>/dev/null || true
    
    log "✅ Configuração Git concluída"
}

# Função para verificar conectividade com GitHub
test_github_connectivity() {
    log "🌐 Testando conectividade com GitHub..."
    
    if curl -s --connect-timeout 10 https://api.github.com >/dev/null; then
        log "✅ Conectividade com GitHub OK"
        return 0
    else
        warning "⚠️ Problema de conectividade com GitHub"
        warning "Verifique sua conexão de internet"
        return 1
    fi
}

# Função para verificar se o repositório é válido
verify_repository() {
    local repo="franc-nt/techify-box"
    log "🔍 Verificando repositório: $repo..."
    
    local api_url="https://api.github.com/repos/$repo"
    
    if curl -s --connect-timeout 10 "$api_url" | grep -q '"name"'; then
        log "✅ Repositório válido: $repo"
        return 0
    else
        warning "⚠️ Repositório não encontrado ou inacessível: $repo"
        return 1
    fi
}

# Função principal
main() {
    log "🚀 Iniciando verificação e configuração do Git..."
    
    # Verificar se está sendo executado como root/sudo (recomendado para instalação)
    if [ "$EUID" -ne 0 ]; then
        warning "⚠️ Script não está sendo executado como root"
        warning "Algumas operações podem falhar se não houver permissões adequadas"
    fi
    
    # Verificar se Git está instalado
    if check_git_installed; then
        log "🎯 Git já está disponível"
    else
        log "📦 Git não encontrado, iniciando instalação..."
        
        if install_git; then
            log "✅ Git instalado com sucesso"
        else
            error "❌ Falha ao instalar Git"
            exit 1
        fi
    fi
    
    # Configurar Git
    configure_git
    
    # Testar conectividade
    if test_github_connectivity; then
        verify_repository
    fi
    
    # Criar arquivo de status para indicar que Git está pronto
    local status_file="/opt/techify-box/.git-ready"
    echo "Git configured at $(date)" > "$status_file"
    
    log "🎉 Configuração do Git concluída com sucesso!"
    log "📁 Status salvo em: $status_file"
    
    # Mostrar versão final
    git --version
}

# Verificar se script está sendo executado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi