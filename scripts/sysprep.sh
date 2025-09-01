#!/bin/bash

# Configurações
CONFIG_FILE="/opt/techify-box/config.json"
LOG_FILE="/var/log/coolify_domain_update.log"
RATHOLE_CONFIG="/etc/rathole/client.toml"

# Função de log simples
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Função para atualizar valor de uma chave no TOML
update_toml_value() {
    local file="$1"
    local key="$2"
    local new_value="$3"
    
    # Procura a linha que contém a chave e substitui o valor
    sed -i "s|^${key}.*|${key} = \"${new_value}\"|" "$file"
}

# Função para atualizar seções existentes no TOML
update_section_names() {
    local file="$1"
    local new_name="$2"
    
    # Detectar seções existentes e renomear
    local existing_sections=$(grep -o '\[client\.services\.[^_]*_http\]' "$file" | sed 's/\[client\.services\.//g' | sed 's/_http\]//g' | sort -u)
    
    for section in $existing_sections; do
        if [[ "$section" != "$new_name" ]]; then
            log "Renomeando seção '$section' para '$new_name'"
            sed -i "s|\[client\.services\.${section}_http\]|[client.services.${new_name}_http]|g" "$file"
            sed -i "s|\[client\.services\.${section}_https\]|[client.services.${new_name}_https]|g" "$file"
        fi
    done
}

# Função para verificar conexões estabelecidas
wait_for_rathole_connections() {
    local max_attempts=30  # máximo de 5 minutos (30 x 10 segundos)
    local attempt=0
    
    log "Aguardando estabelecimento de conexões rathole..."
    
    while [[ $attempt -lt $max_attempts ]]; do
        local connection_count=$(netstat -nalp | grep 62333 | grep ESTABLISHED | wc -l)
        
        log "Tentativa $((attempt + 1))/$max_attempts - Conexões estabelecidas: $connection_count"
        
        if [[ $connection_count -ge 4 ]]; then
            log "✓ Pelo menos 4 conexões estabelecidas detectadas"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log "⚠ AVISO: Timeout aguardando conexões. Continuando mesmo assim..."
    return 1
}

# Função para atualizar rathole config
update_rathole_config() {
    local subdomain="$1"
    local tunnel_token="$2"
    
    log "Iniciando atualização do rathole config..."
    
    # Verificar se arquivo existe
    if [[ ! -f "$RATHOLE_CONFIG" ]]; then
        log "ERRO: Arquivo $RATHOLE_CONFIG não encontrado"
        return 1
    fi
    
    # Fazer backup do arquivo
    cp "$RATHOLE_CONFIG" "${RATHOLE_CONFIG}.bak"
    log "Backup criado: ${RATHOLE_CONFIG}.bak"
    
    # 1. Alterar porta de 62444 para 62333
    update_toml_value "$RATHOLE_CONFIG" "remote_addr" "tunnel.techify.free:62333"
    log "Porta alterada para 62333"
    
    # 2. Atualizar nomes das seções existentes
    update_section_names "$RATHOLE_CONFIG" "$subdomain"
    
    # 3. Atualizar tokens (busca por linhas que começam com token =)
    sed -i "s|^token.*|token = \"${tunnel_token}\"|" "$RATHOLE_CONFIG"
    log "Tokens atualizados"
    
    # 4. Remover qualquer template restante
    sed -i "s/{{tunnel_token}}/${tunnel_token}/g" "$RATHOLE_CONFIG"
    sed -i "s/{{subdomain}}/${subdomain}/g" "$RATHOLE_CONFIG"
    
    log "Configuração do rathole atualizada com sucesso"
    
    # 5. Reiniciar o serviço rathole-client
    log "Reiniciando serviço rathole-client..."
    service rathole-client restart
    
    if [[ $? -eq 0 ]]; then
        log "✓ Serviço rathole-client reiniciado com sucesso"
    else
        log "✗ ERRO: Falha ao reiniciar serviço rathole-client"
        return 1
    fi
    
    # 6. Aguardar conexões estabelecidas
    wait_for_rathole_connections
    
    return 0
}

# Função principal
update_coolify_domain() {
    log "=== Iniciando script de atualização ==="
    
    # Verificar se arquivo de config existe
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log "ERRO: Arquivo de configuração $CONFIG_FILE não encontrado"
        exit 1
    fi
    
    # Extrair subdomain e tunnel_token do config.json
    local subdomain=$(jq -r '.subdomain' "$CONFIG_FILE" 2>/dev/null)
    local tunnel_token=$(jq -r '.tunnel_token' "$CONFIG_FILE" 2>/dev/null)
    
    # Verificar se conseguiu extrair os valores
    if [[ "$subdomain" == "null" || "$tunnel_token" == "null" || -z "$subdomain" || -z "$tunnel_token" ]]; then
        log "ERRO: Não foi possível extrair subdomain ou tunnel_token do arquivo de configuração"
        exit 1
    fi
    
    log "Subdomain: $subdomain"
    log "Token: ${tunnel_token:0:8}..."
    
    # Construir novo FQDN
    local new_fqdn="https://coolify.${subdomain}.techify.free"
    local new_wildcard_domain="https://${subdomain}.techify.free"
    local new_n8n_domain="https://n8n.${subdomain}.techify.free:5678"
    local new_evolution_domain="https://evolution.${subdomain}.techify.free:8080"
    local new_chatwoot_domain="https://atendimento.${subdomain}.techify.free:3000"

    # Obter FQDN atual do banco
    log "Verificando FQDN atual no banco de dados..."
    local current_fqdn=$(docker exec coolify-db psql -U coolify -d coolify -t -c "SELECT fqdn FROM instance_settings;" 2>/dev/null | tr -d ' ')
    
    # Atualizar configuração do rathole PRIMEIRO
    log "Atualizando configuração do rathole..."
    if ! update_rathole_config "$subdomain" "$tunnel_token"; then
        log "ERRO: Falha na atualização do rathole. Abortando..."
        exit 1
    fi
    
    # Comparar domínios e atualizar se necessário
    if [[ "$current_fqdn" == "$new_fqdn" ]]; then
        log "Domínio já está correto: $new_fqdn"
    else
        log "Atualizando domínio de '$current_fqdn' para '$new_fqdn'"
        
        # Atualizar o domínio de acesso ao collify no banco
        docker exec coolify-db psql -U coolify -d coolify -c "UPDATE instance_settings SET fqdn = '$new_fqdn';" > /dev/null 2>&1
        
        # Atualizar o wildcard_domain
        docker exec coolify-db psql -U coolify -d coolify -c "UPDATE server_settings SET wildcard_domain = '$new_wildcard_domain';" > /dev/null 2>&1
        
        # Atualizar domínio do N8N,Evolution e Chatwoot
        docker exec coolify-db psql -U coolify -d coolify -c "UPDATE service_applications SET fqdn = '$new_n8n_domain' WHERE uuid = 'uw08kccw0kg4sgow4ggs0ksw';" > /dev/null 2>&1
        docker exec coolify-db psql -U coolify -d coolify -c "UPDATE service_applications SET fqdn = '$new_evolution_domain' WHERE uuid = 'tkg4w4wcogssok8gs884w0sg';" > /dev/null 2>&1
        docker exec coolify-db psql -U coolify -d coolify -c "UPDATE service_applications SET fqdn = '$new_chatwoot_domain' WHERE uuid = 'r8g0k8gggsgwo4cg08sowo00';" > /dev/null 2>&1

        if [[ $? -eq 0 ]]; then
            log "✓ Domínio atualizado no banco de dados"
        else
            log "✗ ERRO: Falha ao atualizar domínio no banco de dados"
            exit 1
        fi
    fi
    
    # Aguardar um momento antes de reiniciar containers
    log "Aguardando antes de reiniciar containers do Coolify..."
    sleep 5
    
    # Reiniciar o Coolify (somente após rathole estar funcionando)
    log "Reiniciando containers do Coolify..."
    docker restart coolify coolify-proxy > /dev/null 2>&1
    sleep 2
    
    #Reinicia serviço Evolution
    curl 'http://127.0.0.1:8000/api/v1/services/m0wsog4s044kgkk0wg0cwccs/restart' --header 'Authorization: Bearer 1|sylOTlLLfpwDykOnyM6L1MgEvPBG75Ei1QrEE1c58c4b5eaa'
    sleep 2

    #Reinicia serviço Chatwoo
    curl 'http://127.0.0.1:8000/api/v1/services/nc8okw0w0wwk8goow4c8w0ko/restart' --header 'Authorization: Bearer 1|sylOTlLLfpwDykOnyM6L1MgEvPBG75Ei1QrEE1c58c4b5eaa'
    sleep 2

    #Reinicia serviço N8N
    curl 'http://127.0.0.1:8000/api/v1/services/to8wkw8c84og4og844gwo8cc/restart' --header 'Authorization: Bearer 1|sylOTlLLfpwDykOnyM6L1MgEvPBG75Ei1QrEE1c58c4b5eaa'

    
    if [[ $? -eq 0 ]]; then
        log "✓ Containers do Coolify reiniciados com sucesso"
    else
        log "✗ ERRO: Falha ao reiniciar containers do Coolify"
        exit 1
    fi
    
    log "=== Script executado com sucesso ==="
}

# Executar função principal
update_coolify_domain