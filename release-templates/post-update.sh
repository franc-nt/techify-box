#!/bin/bash
# Post-update script template
# This script runs AFTER the update is applied

set -e

echo "🚀 Executando script de pós-atualização..."

# Change to application directory
cd /opt/techify-box

# Install or update Node.js dependencies if needed
if [ -f "package.json" ]; then
    echo "📦 Verificando e atualizando dependências Node.js..."
    
    # Check if package-lock.json was updated
    if [ -f "package-lock.json" ]; then
        echo "🔄 Atualizando dependências..."
        npm ci --production
    else
        npm install --production
    fi
    
    echo "✅ Dependências Node.js atualizadas"
fi

# Set correct permissions for scripts
echo "🔐 Configurando permissões..."
find scripts/ -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
chmod +x release-templates/*.sh 2>/dev/null || true

# Ensure log directory exists and has correct permissions
mkdir -p logs
chown -R $(whoami):$(whoami) logs/ 2>/dev/null || true

# Ensure temp and backup directories exist
mkdir -p temp backups
chown -R $(whoami):$(whoami) temp/ backups/ 2>/dev/null || true

# Clear any temporary files from update process
echo "🧹 Limpando arquivos temporários..."
rm -rf temp/extracted temp/rollback 2>/dev/null || true

# Update PM2 configuration if needed
if command -v pm2 >/dev/null 2>&1; then
    echo "🔄 Atualizando configuração PM2..."
    
    # Stop old process if running
    pm2 stop local-app 2>/dev/null || true
    pm2 delete local-app 2>/dev/null || true
    
    # Start with updated configuration
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ PM2 reconfigurado e serviços reiniciados"
else
    echo "⚠️ PM2 não encontrado, tentando reiniciar via systemd ou processo pai"
    
    # If we don't have PM2, try to restart via parent process
    # This will only work if the application is managed by systemd or similar
    kill -USR2 $PPID 2>/dev/null || true
fi

# Wait a moment for services to start
sleep 3

# Health check
echo "🔍 Verificando saúde da aplicação..."
HEALTH_CHECK_URL="http://localhost:3000/health"
HEALTH_RESPONSE=$(curl -s "$HEALTH_CHECK_URL" || echo "ERROR")

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Aplicação está funcionando corretamente"
    
    # Extract and log the new version
    NEW_VERSION=$(echo "$HEALTH_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$NEW_VERSION" ]; then
        echo "🏷️ Nova versão ativa: $NEW_VERSION"
    fi
else
    echo "⚠️ Aviso: Não foi possível verificar a saúde da aplicação"
    echo "Response: $HEALTH_RESPONSE"
fi

# Create update success marker
echo "$(date): Update completed successfully" >> logs/update-history.log

echo "✅ Script de pós-atualização concluído com sucesso"