#!/bin/bash

# Script de inicialização para configurar tunnel
# Localização: /opt/techify-box/scripts/init.sh

set -e

# Configurações
API_URL="http://tunnel.techify.free:8000/users/auto"
TOKEN="SK_7x9Kp2wB8vN4mQ1zR6yT3sU5jE9aL8cF"
CONFIG_FILE="/opt/techify-box/config.json"
SCRIPT_PATH="/opt/techify-box/scripts/init.sh"
RETRY_INTERVAL=5

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Função para fazer requisição à API
make_api_request() {
    local response
    local http_code
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        --connect-timeout 10 \
        --max-time 30 2>/dev/null || echo "ERROR")
    
    echo "$response"
}

# Função para validar resposta JSON
validate_response() {
    local response="$1"
    
    # Verifica se não houve erro no curl
    if [ "$response" = "ERROR" ]; then
        return 1
    fi
    
    # Verifica se é um JSON válido e contém os campos necessários
    if echo "$response" | jq -e '.subdomain and .tunnel_token' >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para extrair dados da resposta
extract_data() {
    local response="$1"
    
    SUBDOMAIN=$(echo "$response" | jq -r '.subdomain' 2>/dev/null || echo "")
    TUNNEL_TOKEN=$(echo "$response" | jq -r '.tunnel_token' 2>/dev/null || echo "")
}

# Função para atualizar config.json
update_config() {
    log "Atualizando arquivo de configuração..."
    
    # Fazer backup do arquivo original
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
        log "Backup criado: ${CONFIG_FILE}.backup"
    else
        error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
    
    # Atualizar o arquivo usando jq - APENAS subdomain e tunnel_token
    local temp_file
    temp_file=$(mktemp)
    
    jq --arg subdomain "$SUBDOMAIN" --arg tunnel_token "$TUNNEL_TOKEN" \
       '.subdomain = $subdomain | .tunnel_token = $tunnel_token' \
       "$CONFIG_FILE" > "$temp_file"
    
    if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
        mv "$temp_file" "$CONFIG_FILE"
        log "Configuração atualizada com sucesso!"
        log "Subdomain: $SUBDOMAIN"
        log "Tunnel Token: $TUNNEL_TOKEN"
        return 0
    else
        error "Falha ao atualizar configuração"
        rm -f "$temp_file"
        # Restaurar backup
        if [ -f "${CONFIG_FILE}.backup" ]; then
            mv "${CONFIG_FILE}.backup" "$CONFIG_FILE"
            warning "Configuração restaurada do backup"
        fi
        return 1
    fi
}

# Função para limpar arquivos temporários e se excluir
cleanup_and_exit() {
    log "Limpando arquivos temporários..."
    
    # Remover backup se tudo deu certo
    if [ -f "${CONFIG_FILE}.backup" ]; then
        rm -f "${CONFIG_FILE}.backup"
    fi
    
    log "Configuração concluída com sucesso!"
    
    # Executar script de preparação do sistema
    local sysprep_script="/opt/techify-box/scripts/sysprep.sh"
    if [ -f "$sysprep_script" ]; then
        log "Executando script de preparação do sistema..."
        chmod +x "$sysprep_script"
        if "$sysprep_script"; then
            log "Script sysprep.sh executado com sucesso!"
        else
            error "Falha ao executar sysprep.sh"
        fi
    else
        warning "Script sysprep.sh não encontrado em: $sysprep_script"
    fi
    
    log "Removendo script de inicialização..."
    
    # Auto-exclusão do script
    rm -f "$SCRIPT_PATH"
    
    log "Script removido. Inicialização completa!"
    exit 0
}

# Função principal
main() {
    log "Iniciando configuração do tunnel..."
    log "API: $API_URL"
    log "Config: $CONFIG_FILE"
    
    # Verificar se o arquivo de configuração existe
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Arquivo de configuração não encontrado: $CONFIG_FILE"
        exit 1
    fi
    
    # Verificar se jq está disponível
    if ! command -v jq >/dev/null 2>&1; then
        error "jq não está instalado ou disponível no PATH"
        exit 1
    fi
    
    log "Tentando obter configuração do tunnel..."
    
    # Loop principal para tentar a API
    while true; do
        log "Fazendo requisição à API..."
        
        local response
        response=$(make_api_request)
        
        if validate_response "$response"; then
            log "Resposta válida recebida!"
            extract_data "$response"
            
            if [ -n "$SUBDOMAIN" ] && [ -n "$TUNNEL_TOKEN" ] && [ "$SUBDOMAIN" != "null" ] && [ "$TUNNEL_TOKEN" != "null" ]; then
                log "Dados extraídos com sucesso"
                
                if update_config; then
                    cleanup_and_exit
                else
                    error "Falha ao atualizar configuração"
                    exit 1
                fi
            else
                warning "Dados extraídos estão vazios ou inválidos, tentando novamente..."
            fi
        else
            warning "Resposta inválida ou erro na API, tentando novamente em ${RETRY_INTERVAL}s..."
        fi
        
        sleep $RETRY_INTERVAL
    done
}

# Verificar se está sendo executado como root (opcional)
if [ "$EUID" -ne 0 ]; then
    warning "Script não está sendo executado como root"
fi

# Executar função principal
main