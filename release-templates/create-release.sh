#!/bin/bash
# Script para criar uma nova release do Techify Box
# Uso: ./create-release.sh 1.0.1 "Descrição da release"

set -e

# Configurações
REPO_DIR="/opt/techify-box"
RELEASE_DIR="$REPO_DIR/release-templates"
TEMP_RELEASE_DIR="/tmp/techify-box-release"

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

# Verificar parâmetros
if [ $# -lt 1 ]; then
    error "Uso: $0 <versão> [descrição]"
    error "Exemplo: $0 1.0.1 'Correções de bugs e melhorias'"
    exit 1
fi

NEW_VERSION="$1"
RELEASE_DESCRIPTION="${2:-Atualização para versão $NEW_VERSION}"

log "Criando release para versão $NEW_VERSION"

# Validar formato da versão
if ! echo "$NEW_VERSION" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' > /dev/null; then
    error "Formato de versão inválido. Use o formato x.y.z (ex: 1.0.1)"
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "$REPO_DIR/package.json" ]; then
    error "Diretório do projeto não encontrado: $REPO_DIR"
    exit 1
fi

# Obter versão atual
CURRENT_VERSION=$(grep '"version"' "$REPO_DIR/package.json" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
log "Versão atual: $CURRENT_VERSION"
log "Nova versão: $NEW_VERSION"

# Criar diretório temporário para a release
rm -rf "$TEMP_RELEASE_DIR"
mkdir -p "$TEMP_RELEASE_DIR"

log "Preparando arquivos para release..."

# Atualizar versão no package.json
cd "$REPO_DIR"
sed -i "s/\"version\": *\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
log "✅ Versão atualizada no package.json"

# Criar archive com arquivos do projeto
log "🗜️ Criando arquivo compactado..."
tar -czf "$TEMP_RELEASE_DIR/files.tar.gz" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='temp' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='release-templates' \
    .

# Copiar manifesto e scripts
log "📋 Preparando manifesto e scripts..."

# Atualizar manifesto com nova versão
sed "s/\"version\": *\"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$RELEASE_DIR/update-manifest.json" > "$TEMP_RELEASE_DIR/update-manifest.json"
sed -i "s/\"previous_version\": *\"[^\"]*\"/\"previous_version\": \"$CURRENT_VERSION\"/" "$TEMP_RELEASE_DIR/update-manifest.json"

# Copiar scripts
cp "$RELEASE_DIR/pre-update.sh" "$TEMP_RELEASE_DIR/"
cp "$RELEASE_DIR/post-update.sh" "$TEMP_RELEASE_DIR/"

# Criar changelog básico
cat > "$TEMP_RELEASE_DIR/CHANGELOG.md" << EOF
# Changelog - v$NEW_VERSION

## Novidades desta versão

$RELEASE_DESCRIPTION

## Arquivos incluídos

- \`files.tar.gz\` - Arquivos principais da aplicação
- \`update-manifest.json\` - Manifesto de atualização
- \`pre-update.sh\` - Script de pré-atualização
- \`post-update.sh\` - Script de pós-atualização

## Instruções de instalação

A atualização é feita automaticamente através da interface da aplicação:

1. Acesse a aplicação
2. Clique no badge de versão quando mostrar "atualização disponível"
3. Siga as instruções na tela
4. A aplicação será reiniciada automaticamente

## Requisitos

- Git instalado
- Conexão com internet
- Pelo menos 100MB de espaço livre
- Permissões de escrita no diretório da aplicação

---
Gerado automaticamente em $(date)
EOF

log "📁 Arquivos de release preparados em: $TEMP_RELEASE_DIR"
log "📂 Conteúdo da release:"
ls -la "$TEMP_RELEASE_DIR"

# Instruções para o usuário
info ""
info "🎯 PRÓXIMOS PASSOS:"
info "1. Faça commit das mudanças:"
info "   git add ."
info "   git commit -m 'chore: bump version to $NEW_VERSION'"
info ""
info "2. Crie uma tag Git:"
info "   git tag -a v$NEW_VERSION -m 'Release $NEW_VERSION'"
info ""
info "3. Faça push da tag:"
info "   git push origin v$NEW_VERSION"
info ""
info "4. Vá para GitHub e crie uma release:"
info "   - Acesse: https://github.com/franc-nt/techify-box/releases/new"
info "   - Selecione a tag: v$NEW_VERSION"
info "   - Título: 'v$NEW_VERSION'"
info "   - Descrição: '$RELEASE_DESCRIPTION'"
info ""
info "5. Faça upload dos arquivos:"
for file in "$TEMP_RELEASE_DIR"/*; do
    info "   - $(basename "$file")"
done
info ""
info "🎉 Release estará pronta para uso automático!"

warning ""
warning "IMPORTANTE: Não esqueça de fazer o push da tag antes de criar a release no GitHub!"