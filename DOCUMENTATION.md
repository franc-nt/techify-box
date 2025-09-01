# Techify Free Tools - Documentação Completa

## 📋 Visão Geral

**Techify Free Tools** é uma aplicação Node.js com frontend modular que monitora o status de conectividade de subdomínios Coolify através de testes abrangentes de infraestrutura. A aplicação possui sistema de autenticação opcional e executa testes de conectividade sob demanda.

### Principais Funcionalidades
- ✅ **Testes de Conectividade Abrangentes** (5 tipos de teste)
- ✅ **Sistema de autenticação opcional** com senhas
- ✅ **Interface web responsiva** com layout de duas colunas balanceado
- ✅ **Gerenciamento de aplicações via modal** (adicionar, editar, remover)
- ✅ **Testes sob demanda** (executados apenas no carregamento)
- ✅ **Configuração via arquivo JSON** com aplicações dinâmicas
- ✅ **Sistema de edição intuitivo** com validação completa
- ✅ **Arquitetura modular e escalável**
- ✅ **Monitoramento PM2** para alta disponibilidade

---

## 🏗️ Estrutura de Arquivos

```
/opt/techify-box/
├── config.json                    # Configuração principal (subdomain, password, applications)
├── package.json                   # Dependencies e scripts npm
├── server.js                      # Servidor antigo (legacy)
│
├── server/                        # 🔧 BACKEND MODULAR
│   ├── app.js                     # Express app principal
│   ├── server.js                  # Entry point do servidor
│   ├── config/
│   │   └── environment.js         # Configurações centralizadas
│   ├── middleware/
│   │   └── auth.js                # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.js                # Rotas de autenticação
│   │   └── status.js              # Rotas de status/health
│   ├── services/
│   │   ├── authService.js         # Lógica de autenticação
│   │   ├── configService.js       # Gerenciamento config.json
│   │   └── healthService.js       # Testes de conectividade
│   └── utils/                     # (reservado para futuras utilities)
│
└── public/                        # 🎨 FRONTEND MODULAR
    ├── index.html                 # HTML principal
    ├── css/
    │   └── styles.css             # Estilos responsivos
    └── js/
        ├── app.js                 # Aplicação principal refatorada
        ├── app-old.js             # Aplicação anterior (backup)
        ├── config/
        │   └── constants.js       # Constantes e configurações
        ├── utils/
        │   ├── dom.js             # Utilitários DOM + sanitização
        │   └── storage.js         # Wrapper localStorage
        ├── services/
        │   ├── apiService.js      # Comunicação com API
        │   └── authService.js     # Autenticação frontend
        ├── templates/
        │   └── htmlTemplates.js   # Templates HTML
        └── components/            # (reservado para futuros componentes)
```

---

## 🔧 Backend - Arquitetura

### `server/server.js` - Entry Point
- **Função**: Inicia o servidor Express
- **Porta**: 8001 (configurável via environment.js)
- **Features**: Graceful shutdown, cleanup de sessões

### `server/app.js` - Express Application
- **Middlewares**: JSON parsing, static files, logging
- **Rotas**: `/api/auth/*`, `/api/status/*`, `/health`
- **Error Handling**: Global error handler

### `server/config/environment.js` - Configurações
```javascript
const config = {
    server: { port: 8001, host: 'localhost' },
    app: { passwordMinLength: 4 },
    external: { timeout: 5000, baseUrl: 'https://coolify.{subdomain}.techify.free/login' },
    files: { config: 'config.json' },
    tests: {
        internetTimeout: 5000,
        serverTimeout: 8000,
        tunnelTimeout: 5000,
        externalTimeout: 8000
    }
};
```

### `server/services/` - Business Logic

#### `configService.js` - Gerenciamento Config
- `readConfig()` - Lê config.json
- `writeConfig(data)` - Escreve config.json
- `getSubdomain()` - Obtém subdomain
- `getApplications()` - Obtém lista de aplicações com URLs resolvidas
- `addApplication(applicationData)` - Adiciona nova aplicação com validação de subdomínio
- `updateApplication(index, updates)` - Atualiza aplicação existente por índice
- `removeApplication(index)` - Remove aplicação por índice
- `hasPassword()` - Verifica se tem senha
- `updatePassword(hash)` - Atualiza senha
- `removePassword()` - Remove senha

**Correções Implementadas:**
- ✅ **Validação de Subdomínio**: Campo `subdomain` agora é processado corretamente
- ✅ **Logs de Debug**: Adicionados logs para monitorar dados recebidos
- ✅ **URL Correta**: URLs geradas com base no subdomínio informado pelo usuário
- ✅ **Fallback Seguro**: Se subdomain não informado, usa className como fallback

#### `authService.js` - Autenticação
- **Session Storage**: Map em memória (sessions)
- **Password Hashing**: SHA-256
- **Session Management**: Timeout, cleanup automático
- **Métodos principais**:
  - `login(password)` - Autentica usuário
  - `setPassword(password)` - Define nova senha
  - `removePassword()` - Remove proteção
  - `isAuthenticated(sessionId)` - Verifica auth

#### `healthService.js` - Testes de Conectividade
- **Testes Implementados**:
  - `testInternetConnectivity()` - Ping para 1.1.1.1
  - `testTechifyServer()` - Conexão TCP para tunnel.techify.free:62333
  - `testSubdomainStatus(subdomain)` - Verifica se subdomain ≠ "waiting"
  - `testTunnelConnections(subdomain)` - Verifica ≥4 conexões ESTABLISHED:62333
  - `testExternalAccess(subdomain)` - HTTP 200 para Coolify login
- `runAllTests(subdomain)` - Executa todos os testes em paralelo
- `getCurrentStatus(subdomain)` - Alias para runAllTests (compatibilidade)
- **Timeouts**: 5-8 segundos por teste
- **Lógica Condicional**: Testes dependentes mostram "Aguardando" se subdomain = "waiting"

### `server/routes/` - API Endpoints

#### `/api/auth/*` (auth.js)
- `GET /status` - Status de autenticação
- `POST /login` - Login com senha
- `POST /set-password` - Define senha
- `POST /remove-password` - Remove senha (requer auth)
- `POST /logout` - Logout

#### `/api/status/*` (status.js)
- `GET /` - Status da aplicação (protegido)
- `GET /health` - Health check simples
- `GET /subdomain` - Obtém subdomain (protegido)
- `GET /applications` - Obtém lista de aplicações configuradas (protegido)

### `server/middleware/auth.js` - Autenticação
- `requireAuth()` - Middleware que requer autenticação
- `optionalAuth()` - Middleware opcional
- `extractSessionId()` - Extrai session ID do header

---

## 🎨 Frontend - Arquitetura

### `public/js/app.js` - Aplicação Principal
**Padrão**: Module Pattern com namespace global

```javascript
const App = {
    state: { isInitialized, elements, currentSubdomain },
    init() - Inicialização
    showAuthUI() - Interface de autenticação
    showMainUI() - Interface principal com layout de duas colunas
    bindEvents() - Event listeners
    startStatusUpdates() - Executa testes uma vez no carregamento
    updateTestResults(tests) - Atualiza resultados individuais dos testes
    updateTestElement(id, result) - Atualiza elemento específico do teste
};
```

### `public/js/config/constants.js` - Configurações
- **API Endpoints**: URLs da API
- **App Settings**: Intervalos, configurações
- **UI Settings**: Timeouts, durações
- **Selectors**: Seletores CSS
- **CSS Classes**: Classes reutilizáveis

### `public/js/utils/` - Utilitários

#### `dom.js` - Manipulação DOM
- **Segurança**: `sanitizeHTML()` remove scripts
- **Helpers**: querySelector, getElementById, etc.
- **Content**: `setContent()` com sanitização
- **Classes**: addClass, removeClass, toggleClass
- **Values**: getValue, setValue para inputs

#### `storage.js` - LocalStorage
- **Wrapper**: JSON serialization automática
- **Error Handling**: Try/catch em todas operações
- **Session**: Métodos específicos para sessionId
- **Availability**: Verifica se localStorage está disponível

### `public/js/services/` - Comunicação

#### `apiService.js` - API Client
- **Authentication**: Headers automáticos com Bearer token
- **Methods**: get(), post() com error handling
- **Endpoints**: Métodos específicos para cada API
- **Error Mapping**: Mensagens user-friendly

#### `authService.js` - Autenticação Frontend
- **State Management**: Gerencia estado de auth
- **Integration**: Conecta com apiService
- **Validation**: Validação de senhas
- **Session Handling**: Gerencia sessionId no localStorage

### `public/js/templates/htmlTemplates.js` - Templates
- `getAuthTemplate(hasPassword)` - UI de autenticação
- `getMainTemplate(hasPassword)` - UI principal com layout balanceado
- `getAddApplicationModalTemplate()` - Modal para adicionar aplicações
- `getEditApplicationModalTemplate()` - Modal para editar aplicações
- `getServicesTableRows(applications)` - Linhas da tabela de serviços
- `getStatusTemplate(externalTest)` - Status display
- `getUrlTemplate(url)` - Link template
- **Pattern**: Template literals com interpolação

---

## 🔄 Fluxo de Funcionamento

### 1. Inicialização
```
index.html loads → constants.js → utils → services → app.js
↓
App.init() → AuthService.init() → Check auth status
↓
Show appropriate UI (Auth or Main)
```

### 2. Autenticação
```
User enters password → AuthService.login() → ApiService.post()
↓
Server validates → Returns sessionId → Stored in localStorage
↓
UI switches to Main → Start status updates
```

### 3. Testes de Conectividade (Sob Demanda)
```
Page Load: App.updateStatus() → ApiService.getStatus()
↓
Server: HealthService.runAllTests(subdomain) → 5 testes paralelos
↓
UI updates: teste individual, status, timestamp
```

**Testes Executados:**
- **Internet**: Ping 1.1.1.1 → "Ok" ou "Fail"
- **Servidor Techify**: TCP tunnel.techify.free:62333 → "Ok" ou "Fail"  
- **Subdomínio**: Verifica se ≠ "waiting" → "Aguardando" ou "OK"
- **Túnel**: Verifica ≥4 conexões ESTABLISHED:62333 → "Aguardando", "OK" ou "Fail"
- **Alcance Externo**: HTTP 200 para Coolify login → "Aguardando", "OK" ou "Fail"

### 4. Password Management
```
Set: UI → AuthService → ApiService → ConfigService.updatePassword()
Remove: UI → AuthService → ApiService → ConfigService.removePassword()
```

### 5. Carregamento de Aplicações
```
Page Load: App.loadApplications() → ApiService.getApplications()
↓
Server: ConfigService.getApplications() → Lê config.json
↓
UI updates: Tabela de serviços com aplicações dinâmicas
```

### 6. Gerenciamento de Aplicações Via Modal

#### Adicionar Nova Aplicação
```
User clicks "Adicionar Aplicação" → Modal opens
↓
User fills: Nome, Subdomínio, Usuário, Senha → Click "Adicionar"
↓
Frontend: Validation → ApiService.addApplication()
↓
Backend: ConfigService.addApplication() → Updates config.json
↓
UI reloads with new application in table
```

#### Editar Aplicação Existente
```
User clicks edit button (pencil icon) → Modal opens with current data
↓
User modifies fields → Click "Salvar Alterações"
↓
Frontend: Validation → ApiService.updateApplication()
↓
Backend: ConfigService.updateApplication() → Updates config.json
↓
UI reloads with updated application data
```

#### Remover Aplicação
```
User clicks remove button (trash icon) → Confirmation dialog
↓
User confirms → ApiService.removeApplication()
↓
Backend: ConfigService.removeApplication() → Updates config.json
↓
UI reloads without removed application
```

---

## 📋 Estrutura do config.json

O arquivo `config.json` centraliza todas as configurações da aplicação:

```json
{
  "subdomain": "franc",
  "password": null,
  "applications": [
    {
      "name": "Coolify",
      "className": "coolify",
      "url": "https://coolify.{subdomain}.techify.free",
      "username": "local@coolify.io",
      "password": "password"
    },
    {
      "name": "Portainer",
      "className": "portainer", 
      "url": "https://portainer.{subdomain}.techify.free",
      "username": "admin",
      "password": "password"
    },
    {
      "name": "n8n",
      "className": "n8n",
      "url": "https://n8n.{subdomain}.techify.free",
      "username": "admin@n8n.io",
      "password": "password"
    },
    {
      "name": "Grafana",
      "className": "grafana",
      "url": "https://grafana.{subdomain}.techify.free", 
      "username": "admin",
      "password": "password"
    },
    {
      "name": "Uptime Kuma",
      "className": "uptime",
      "url": "https://uptime.{subdomain}.techify.free",
      "username": "admin",
      "password": "password"
    }
  ]
}
```

### Campos do config.json:
- **subdomain**: Nome do subdomínio (usado para resolver URLs)
- **password**: Hash da senha de proteção (null = sem senha)
- **applications**: Array de aplicações a serem exibidas

### Campos de cada aplicação:
- **name**: Nome exibido na interface
- **className**: Classe CSS para styling (coolify, portainer, n8n, grafana, uptime)
- **url**: URL com placeholder `{subdomain}` substituído automaticamente
- **username**: Nome de usuário para login
- **password**: Senha para login

### Como adicionar novas aplicações:
1. Edite o arquivo `config.json`
2. Adicione novo objeto no array `applications`
3. A aplicação aparecerá automaticamente na interface
4. Não é necessário alterar código

---

## 🛠️ Como Fazer Modificações

### Adicionar Nova Funcionalidade

#### 1. Backend - Nova API
```javascript
// server/routes/newFeature.js
const express = require('express');
const router = express.Router();
const NewService = require('../services/newService');

router.get('/', async (req, res) => {
    // Implementation
});

module.exports = router;
```

#### 2. Frontend - Novo Serviço
```javascript
// public/js/services/newService.js
const NewService = {
    async getData() {
        return await window.ApiService.get('/api/new-endpoint');
    }
};
window.NewService = NewService;
```

#### 3. Integração
- Adicionar rota em `server/app.js`
- Adicionar script em `public/index.html`
- Usar no `public/js/app.js`

### Modificar Configurações
```javascript
// server/config/environment.js
const config = {
    // Adicionar novas configurações aqui
    newFeature: {
        enabled: true,
        timeout: 1000
    }
};
```

### Adicionar Novos Templates
```javascript
// public/js/templates/htmlTemplates.js
getNewTemplate(data) {
    return `<div class="new-feature">${data.content}</div>`;
}
```

---

## 🔍 Debugging e Testes

### Logs do Backend
```javascript
console.log('Server:', message);  // Server logs
console.error('Error:', error);   // Error logs
```

### Logs do Frontend
```javascript
console.log('🚀 App message');    // App logs
console.error('❌ Error:', error); // Error logs
```

### Testar API Endpoints
```bash
# Health check
curl http://localhost:8001/health

# Auth status
curl http://localhost:8001/api/auth/status

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}'
```

### Estrutura de Resposta API
```javascript
// Success
{
    "data": "response data",
    "timestamp": "23/07/2025, 22:31:19"
}

// Error
{
    "error": "Error message",
    "code": "ERROR_CODE",
    "timestamp": "23/07/2025, 22:31:19"
}
```

---

## ⚙️ Configuração e Deploy

### Variáveis de Ambiente
```bash
PORT=8001                    # Porta do servidor
HOST=localhost              # Host do servidor
```

### Scripts NPM
```bash
npm start                   # Inicia servidor modular
npm run dev                 # Desenvolvimento
npm run old                 # Servidor legacy
```

### Dependências
```json
{
    "axios": "^1.11.0",     # HTTP client
    "express": "^5.1.0",    # Web framework
    "toml": "^3.0.0"        # TOML parser (ainda usado para compatibilidade)
}
```

---

## 🚨 Pontos de Atenção

### Segurança
- **Senhas**: SHA-256 (adequado para uso local)
- **Sessions**: Em memória (perdidas no restart)
- **XSS**: Sanitização básica implementada
- **CSRF**: Não implementado (uso local)

### Performance
- **Sessions**: Cleanup automático a cada hora
- **Requests**: Timeout de 5-8s para testes de conectividade
- **Tests**: Executados sob demanda (apenas no carregamento)

### Limitações
- **Express 5.x**: Problema com path-to-regexp
- **Session Storage**: Apenas em memória
- **Error Handling**: Básico, pode ser melhorado

---

## 📚 Para Desenvolvedores

### Padrões de Código
- **JSDoc**: Documentação de funções
- **Error First**: Callbacks com error primeiro
- **Async/Await**: Para operações assíncronas
- **Module Pattern**: Namespaces globais no frontend

### Convenções
- **Nomes**: camelCase para variáveis e funções
- **Constantes**: UPPER_CASE
- **Arquivos**: kebab-case
- **Classes CSS**: BEM-like naming

### Extensibilidade
- **Modular**: Fácil adicionar novos módulos
- **Configurável**: Centralized config
- **Testável**: Separação de responsabilidades
- **Documentado**: JSDoc e comentários

---

## 🎨 Layout e Interface

### Layout Balanceado de Duas Colunas
A interface principal utiliza um grid CSS com proporção otimizada:

```css
.content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;  /* Testes: Serviços = 1:2 */
    gap: 24px;
}
```

**Benefícios:**
- **Seção de Testes**: Mais compacta (33% da largura) - apenas 5 testes simples
- **Seção de Serviços**: Mais espaçosa (67% da largura) - tabela com mais informações
- **Responsivo**: Em telas menores, vira coluna única automaticamente

### Sistema de Modal Intuitivo
- **Design Consistente**: Modais de adicionar e editar idênticos
- **Validação em Tempo Real**: Feedback imediato para campos obrigatórios
- **Múltiplas Formas de Fechar**: ESC, X, clique fora, botão cancelar
- **Preenchimento Automático**: Modal de edição carrega dados atuais

### Melhorias Visuais
- **Botões de Ação**: Editar (azul) e Remover (vermelho) com ícones SVG
- **URLs Clicáveis**: Links azuis que abrem em nova aba
- **Estados Visuais**: Hover effects, loading states, feedback de sucesso
- **Tipografia**: Fonte Inter para melhor legibilidade
- **Espaçamento**: Padding e margins consistentes em toda aplicação

---

## 🎯 Status Atual

✅ **Funcional**: Aplicação totalmente operacional
✅ **Modular**: Backend e frontend refatorados
✅ **Interface Moderna**: Layout balanceado com sistema de modal intuitivo
✅ **Documentado**: Documentação completa e atualizada
✅ **Testado**: Interface funcionando perfeitamente
✅ **Migrado para JSON**: Config.toml → config.json com aplicações dinâmicas
✅ **Sistema de Edição**: Modal-based com validação completa

**Ready for production local use!** 🚀
