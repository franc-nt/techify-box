# 📦 Templates de Release - Techify Box

Este diretório contém todos os templates e scripts necessários para criar releases do Techify Box.

## 🚀 Uso Rápido

Para criar uma nova release, execute:

```bash
./create-release.sh 1.0.1 "Descrição das mudanças"
```

## 📁 Arquivos

### 🤖 Scripts Automatizados

- **[`create-release.sh`](create-release.sh)** - Script principal para criar releases
  - Atualiza versão no package.json
  - Cria arquivo compactado com arquivos da aplicação
  - Prepara manifesto e scripts
  - Gera instruções para GitHub

### 📋 Templates

- **[`update-manifest.json`](update-manifest.json)** - Template do manifesto de atualização
  - Define quais arquivos atualizar
  - Especifica scripts para executar
  - Configura opções de backup e restart

### 🔧 Scripts de Instalação

- **[`pre-update.sh`](pre-update.sh)** - Script de pré-instalação
  - Para serviços
  - Verifica requisitos
  - Instala dependências do sistema

- **[`post-update.sh`](post-update.sh)** - Script de pós-instalação
  - Atualiza dependências Node.js
  - Configura permissões
  - Reinicia serviços
  - Verifica saúde da aplicação

## 🎯 Fluxo de Criação de Release

### 1. Preparação
```bash
# Certifique-se de estar no diretório correto
cd /opt/techify-box

# Verifique se há mudanças não commitadas
git status
```

### 2. Criar Release
```bash
# Execute o script de criação
./release-templates/create-release.sh 1.0.1 "Suas mudanças aqui"
```

### 3. Seguir Instruções
O script mostrará exatamente o que fazer:

```bash
# Exemplo de output:
🎯 PRÓXIMOS PASSOS:
1. Faça commit das mudanças:
   git add .
   git commit -m 'chore: bump version to 1.0.1'

2. Crie uma tag Git:
   git tag -a v1.0.1 -m 'Release 1.0.1'

3. Faça push da tag:
   git push origin v1.0.1

4. Vá para GitHub e crie uma release:
   - Acesse: https://github.com/franc-nt/techify-box/releases/new
   - Selecione a tag: v1.0.1
   - Faça upload dos arquivos gerados

5. Publique a release
```

### 4. Assets Obrigatórios

Cada release deve incluir estes arquivos:

- ✅ **`files.tar.gz`** - Arquivos da aplicação
- ✅ **`update-manifest.json`** - Manifesto de atualização  
- ✅ **`pre-update.sh`** - Script de pré-instalação
- ✅ **`post-update.sh`** - Script de pós-instalação

## 📝 Tipos de Release

### 🔧 Patch (1.0.0 → 1.0.1)
- Correções de bugs
- Pequenas melhorias
- Não quebra compatibilidade

```bash
./create-release.sh 1.0.1 "Corrigido bug na autenticação"
```

### ✨ Minor (1.0.0 → 1.1.0)
- Novas funcionalidades
- Melhorias significativas
- Mantém compatibilidade

```bash
./create-release.sh 1.1.0 "Adicionado sistema de notificações"
```

### 💥 Major (1.0.0 → 2.0.0)
- Mudanças que quebram compatibilidade
- Reestruturações importantes
- Migrações de dados

```bash
./create-release.sh 2.0.0 "Nova arquitetura com banco de dados"
```

## ⚙️ Configuração de Scripts

### Personalizando pre-update.sh

```bash
#!/bin/bash
# Adicione comandos específicos para sua release

# Exemplo: Backup de configuração específica
cp config.json config.json.backup

# Exemplo: Verificação de dependência
if ! command -v docker >/dev/null; then
    echo "Docker é necessário para esta versão"
    exit 1
fi
```

### Personalizando post-update.sh

```bash
#!/bin/bash
# Adicione comandos de pós-instalação

# Exemplo: Migração de dados
node scripts/migrate-database.js

# Exemplo: Configuração automática
echo "Configurando novos recursos..."
```

## 🔍 Verificações Automáticas

O sistema verifica automaticamente:

- ✅ **Git** - Instala se não estiver presente
- ✅ **Internet** - Testa conectividade com GitHub
- ✅ **Espaço** - Verifica pelo menos 100MB livres
- ✅ **Permissões** - Testa escrita no diretório
- ✅ **Saúde** - Verifica se aplicação responde após update

## 📞 Suporte

Para problemas com releases:

1. Verifique os logs em [`/opt/techify-box/logs/`](../logs/)
2. Execute diagnóstico: `./scripts/setup-git.sh`
3. Teste conectividade: `curl -I https://api.github.com`
4. Abra issue no repositório se necessário

---
*Templates de Release - Techify Box v1.0.0+*