#!/bin/bash
# Pre-update script template
# This script runs BEFORE the update is applied

set -e

echo "🔧 Executando script de pré-atualização..."

# Stop services gracefully
echo "🛑 Parando serviços..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop local-app || true
    echo "✅ PM2 local-app parado"
else
    echo "⚠️ PM2 não encontrado, pulando parada de serviços"
fi

# Check if backup directory exists
BACKUP_DIR="/opt/techify-box/backups"
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "✅ Diretório de backup criado"
fi

# Verify system requirements
echo "🔍 Verificando requisitos do sistema..."

# Check available disk space (at least 100MB)
AVAILABLE_SPACE=$(df /opt/techify-box | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 102400 ]; then
    echo "❌ Espaço em disco insuficiente. Necessário pelo menos 100MB"
    exit 1
fi

# Check if Git is installed
if ! command -v git >/dev/null 2>&1; then
    echo "🔄 Instalando Git..."
    apt-get update && apt-get install -y git
    echo "✅ Git instalado com sucesso"
fi

# Ensure Node.js modules are healthy
if [ -f "/opt/techify-box/package.json" ]; then
    echo "🔍 Verificando dependências Node.js..."
    cd /opt/techify-box
    
    # Quick check for critical modules
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/pm2" ]; then
        echo "🔄 Reinstalando dependências Node.js..."
        npm install
        echo "✅ Dependências Node.js reinstaladas"
    fi
fi

echo "✅ Script de pré-atualização concluído com sucesso"