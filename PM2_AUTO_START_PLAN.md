# Plano para Configurar PM2 Auto-Start

## Problema Identificado
A aplicação não está configurada para iniciar automaticamente após reboot do servidor Ubuntu/Debian.

## Configuração Atual Analisada
- [`ecosystem.config.js`](ecosystem.config.js:1-26) está correto com configuração da aplicação `local-app`
- [`package.json`](package.json:9-16) tem scripts PM2 básicos configurados
- Falta apenas configurar o auto-start do PM2 no sistema

## Solução Passo a Passo

### 1. Comandos para Executar (Ubuntu/Debian)

```bash
# 1. Navegar para o diretório do projeto
cd /opt/techify-box

# 2. Parar e limpar aplicações PM2 existentes
pm2 stop all
pm2 delete all

# 3. Iniciar aplicação usando ecosystem.config.js
pm2 start ecosystem.config.js

# 4. Gerar comando de startup para systemd (Ubuntu/Debian)
pm2 startup systemd

# 5. Copiar e executar o comando gerado como sudo
# (PM2 mostrará o comando exato para copiar)

# 6. Salvar configuração atual
pm2 save

# 7. Verificar status
pm2 status
```

### 2. Script Automatizado

Criar o arquivo `scripts/setup-pm2-autostart.sh`:

```bash
#!/bin/bash
set -e

echo "=== Configurando PM2 Auto-Start ==="

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "Erro: execute a partir do diretório do projeto"
    exit 1
fi

# Parar aplicações
pm2 stop all || true
pm2 delete all || true

# Iniciar aplicação
pm2 start ecosystem.config.js

# Configurar startup
echo "Configurando PM2 startup..."
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME)

echo "Execute como sudo:"
echo "$STARTUP_CMD"

# Salvar configuração
pm2 save

echo "=== Configuração PM2 Completa ==="
pm2 status
```

### 3. Verificação da Configuração

```bash
# Verificar se serviço foi criado
sudo systemctl status pm2-$USER

# Testar reinicialização (opcional)
sudo reboot
```

### 4. Comandos de Manutenção

```bash
# Ver logs
pm2 logs local-app

# Reiniciar aplicação
pm2 restart local-app

# Verificar se auto-start está ativo
pm2 startup
```

## Sequência de Execução Recomendada

1. **Executar comandos manualmente** (mais seguro)
2. **Ou usar script automatizado** (mais rápido)
3. **Testar com reboot** do servidor

## Arquivos que Precisam ser Criados/Modificados

- `scripts/setup-pm2-autostart.sh` - Script de configuração
- Nenhuma modificação necessária nos arquivos existentes

## Resultado Esperado

Após reboot do servidor:
- PM2 inicia automaticamente
- Aplicação `local-app` fica disponível
- Status: `pm2 status` mostra aplicação rodando

## Troubleshooting

Se não funcionar:
1. Verificar se comando sudo foi executado
2. Verificar logs: `journalctl -u pm2-$USER`
3. Recriar configuração: `pm2 unstartup systemd` e repetir processo