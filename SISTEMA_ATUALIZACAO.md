# 🚀 Sistema de Atualização Automática - Techify Box

Este documento explica como usar o sistema de versionamento e atualização automática implementado no Techify Box.

## 📋 Visão Geral

O sistema permite que usuários atualizem suas instalações automaticamente através da interface web, sem necessidade de comandos manuais ou conhecimento técnico.

### ✨ Características Principais

- **Verificação automática** de atualizações no GitHub
- **Interface visual** com progresso em tempo real
- **Backup automático** antes de cada atualização
- **Rollback automático** em caso de falha
- **Instalação automática** de dependências do sistema (Git)
- **Scripts customizáveis** para pré e pós-instalação
- **Logs detalhados** de todo o processo

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   Aplicação     │    │   Interface     │
│   Releases      │◄──►│   Backend       │◄──►│   Web           │
│                 │    │                 │    │                 │
│ • Tags (v1.0.1) │    │ • UpdateService │    │ • Badge Versão  │
│ • Assets        │    │ • InstallService│    │ • Modal Update  │
│ • Manifesto     │    │ • Validation    │    │ • Progresso     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Para Desenvolvedores: Como Criar Releases

### 1. Preparar Nova Versão

1. **Faça as alterações** no código
2. **Teste localmente** para garantir que tudo funciona
3. **Execute o script de criação** de release:

```bash
cd /opt/techify-box
./release-templates/create-release.sh 1.0.1 "Descrição das mudanças"
```

### 2. Processo Automático do Script

O script [`create-release.sh`](release-templates/create-release.sh) automaticamente:

- ✅ Atualiza o [`package.json`](package.json:3) com nova versão
- ✅ Cria arquivos compactados da aplicação
- ✅ Prepara manifesto de atualização
- ✅ Gera scripts de pré/pós instalação
- ✅ Cria changelog automático
- ✅ Fornece instruções para GitHub

### 3. Publicar no GitHub

Após executar o script, siga as instruções mostradas:

```bash
# 1. Commit as mudanças
git add .
git commit -m "chore: bump version to 1.0.1"

# 2. Criar tag
git tag -a v1.0.1 -m "Release 1.0.1"

# 3. Push da tag
git push origin v1.0.1
```

### 4. Criar Release no GitHub

1. Acesse: https://github.com/franc-nt/techify-box/releases/new
2. Selecione a tag: `v1.0.1`
3. Título: `v1.0.1`
4. Descrição: Copie do arquivo `CHANGELOG.md` gerado
5. **Upload dos assets** obrigatórios:
   - `files.tar.gz` - Arquivos da aplicação
   - `update-manifest.json` - Manifesto de atualização
   - `pre-update.sh` - Script pré-instalação
   - `post-update.sh` - Script pós-instalação

## 📱 Para Usuários: Como Atualizar

### Interface Visual

1. **Badge de Versão**: Aparece no canto inferior direito
   - 🏷️ Cinza = Versão atual
   - 🔄 Amarelo pulsante = Atualização disponível

2. **Clique no Badge** quando atualização estiver disponível

3. **Modal de Atualização** mostrará:
   - Versão atual vs nova versão
   - Lista de novidades (changelog)
   - Verificação de requisitos do sistema
   - Avisos importantes

4. **Clique "Atualizar Agora"** para iniciar

5. **Acompanhe o Progresso**:
   - ✅ Verificando atualizações
   - ✅ Criando backup
   - ✅ Baixando arquivos
   - ✅ Aplicando alterações
   - ✅ Reiniciando serviços

### Processo Automático

O sistema automaticamente:
- 🔍 Verifica requisitos (Git, internet, espaço, permissões)
- 💾 Cria backup completo da instalação atual
- ⬇️ Baixa arquivos da nova versão do GitHub
- 🔧 Executa scripts de pré-instalação
- 📁 Substitui arquivos preservando configurações
- ⚙️ Instala dependências se necessário
- 🔄 Executa scripts de pós-instalação
- 🚀 Reinicia serviços com PM2
- ✅ Verifica saúde da aplicação

## 📁 Estrutura de Arquivos

```
/opt/techify-box/
├── backups/                    # Backups automáticos
│   └── backup-2025-01-09.zip
├── logs/                       # Logs do sistema
│   ├── update.log             # Log de atualizações
│   └── update-history.log     # Histórico
├── release-templates/          # Templates para releases
│   ├── update-manifest.json   # Template do manifesto
│   ├── pre-update.sh         # Script pré-instalação
│   ├── post-update.sh        # Script pós-instalação
│   └── create-release.sh     # Automatização
├── scripts/
│   ├── setup-git.sh          # Instalação automática Git
│   └── ...
└── server/services/
    ├── updateService.js      # Verificação updates
    └── installService.js     # Instalação updates
```

## 🛠️ Manifesto de Atualização

O arquivo [`update-manifest.json`](release-templates/update-manifest.json) controla como a atualização é aplicada:

```json
{
  "version": "1.0.1",
  "type": "minor",
  "requires_restart": true,
  "requires_npm_install": false,
  "backup_required": true,
  "files_to_update": [
    "server/app.js",
    "public/js/app.js"
  ],
  "files_to_preserve": [
    "config.json",
    "logs/",
    "backups/"
  ]
}
```

### Campos do Manifesto

- **`version`**: Nova versão sendo instalada
- **`type`**: Tipo de atualização (major, minor, patch)
- **`requires_restart`**: Se requer reinicialização dos serviços
- **`requires_npm_install`**: Se requer `npm install`
- **`files_to_update`**: Arquivos específicos para atualizar
- **`files_to_preserve`**: Arquivos que nunca devem ser sobrescritos

## 🔧 Scripts Personalizados

### Pre-Update Script
Executado **antes** da atualização:
- Parar serviços
- Verificar requisitos
- Preparar ambiente

### Post-Update Script  
Executado **depois** da atualização:
- Instalar dependências
- Configurar permissões
- Reiniciar serviços
- Verificar saúde

## 🔐 Segurança e Confiabilidade

### Validações de Segurança
- ✅ Verificação de checksums dos arquivos
- ✅ Validação de espaço em disco
- ✅ Verificação de permissões
- ✅ Teste de conectividade

### Sistema de Backup
- ✅ Backup automático antes de cada update
- ✅ Backup inclui arquivos críticos
- ✅ Rollback automático em caso de falha
- ✅ Limpeza automática de backups antigos

### Logs e Monitoramento
- ✅ Log detalhado de cada etapa
- ✅ Timestamp de todas as operações
- ✅ Mensagens de erro específicas
- ✅ Histórico de atualizações

## 🚨 Solução de Problemas

### Problemas Comuns

#### ❌ "Git não está instalado"
**Solução**: O sistema tenta instalar automaticamente. Se falhar:
```bash
sudo apt-get update && sudo apt-get install -y git
```

#### ❌ "Sem conexão com internet"
**Solução**: Verifique conectividade:
```bash
curl -I https://api.github.com
```

#### ❌ "Sem permissões de escrita"
**Solução**: Execute como root ou ajuste permissões:
```bash
sudo chown -R $(whoami):$(whoami) /opt/techify-box
```

#### ❌ "Espaço em disco insuficiente"
**Solução**: Libere espaço ou limpe logs antigos:
```bash
# Limpar logs antigos
sudo find /var/log -name "*.log" -mtime +30 -delete

# Verificar espaço
df -h /opt/techify-box
```

### Rollback Manual

Se necessário, faça rollback manual:

```bash
cd /opt/techify-box
ls backups/  # Listar backups disponíveis
unzip backups/backup-2025-01-09.zip -d temp/
cp -r temp/* .
pm2 restart local-app
```

## 🔄 Endpoints da API

### Para Desenvolvedores

```javascript
// Verificar versão atual
GET /api/status/version

// Verificar atualizações
GET /api/updates/check

// Validar requisitos
GET /api/updates/requirements

// Iniciar instalação
POST /api/updates/install

// Status da instalação
GET /api/updates/status

// Rollback
POST /api/updates/rollback
```

## 📈 Versionamento Semântico

Siga o padrão **SemVer** (Semantic Versioning):

- **MAJOR** (1.0.0 → 2.0.0): Mudanças incompatíveis
- **MINOR** (1.0.0 → 1.1.0): Novas funcionalidades compatíveis
- **PATCH** (1.0.0 → 1.0.1): Correções de bugs

## 🎯 Exemplo Completo de Release

### 1. Desenvolvimento
```bash
# Fazer mudanças no código
vim server/app.js

# Testar localmente
npm run dev
```

### 2. Criar Release
```bash
# Executar script de criação
./release-templates/create-release.sh 1.0.1 "Corrigido bug na autenticação"

# Seguir instruções mostradas pelo script
git add .
git commit -m "chore: bump version to 1.0.1"
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1
```

### 3. Publicar no GitHub
- Criar release com tag `v1.0.1`
- Upload dos 4 arquivos gerados
- Publicar release

### 4. Usuários Atualizam
- Badge de versão fica amarelo 🔄
- Usuário clica e segue processo visual
- Atualização é aplicada automaticamente

## 🎉 Benefícios do Sistema

### Para Desenvolvedores
- ✅ Processo padronizado de releases
- ✅ Automação completa de packaging
- ✅ Scripts reutilizáveis
- ✅ Versionamento controlado

### Para Usuários
- ✅ Um clique para atualizar
- ✅ Interface visual clara
- ✅ Processo seguro com backup
- ✅ Rollback automático se falhar

### Para VMs Open Source
- ✅ Cada instalação pode se auto-atualizar
- ✅ Não requer conhecimento técnico
- ✅ Compatível com diferentes distribuições Linux
- ✅ Sistema robusto e confiável

---

**🔗 Links Importantes:**
- Repositório: https://github.com/franc-nt/techify-box
- Releases: https://github.com/franc-nt/techify-box/releases
- Issues: https://github.com/franc-nt/techify-box/issues

---
*Documentação do Sistema de Atualização - Techify Box v1.0.0+*