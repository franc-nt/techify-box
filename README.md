# Techify Local Dashboard

Uma aplicação web para gerenciar e acessar diferentes serviços da Techify (Coolify, Chatwoot, N8N, Evolution API) através de um dashboard centralizado.

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd local
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo de configuração:
```bash
cp config.example.json config.json
```

4. Edite o arquivo `config.json` com suas configurações:
   - Substitua `your-subdomain` pelo seu subdomínio
   - Substitua `your-tunnel-token-here` pelo seu token de túnel
   - Configure as credenciais de acesso para cada aplicação

## ⚙️ Configuração

### Estrutura do config.json

```json
{
  "subdomain": "seu-subdominio",
  "tunnel_token": "seu-token-aqui",
  "applications": [
    {
      "name": "Nome da Aplicação",
      "className": "classe-css",
      "url": "https://url.da.aplicacao",
      "username": "seu-usuario",
      "password": "sua-senha"
    }
  ]
}
```

### Aplicações Suportadas

- **Coolify Local**: Gerenciador de aplicações local
- **Coolify Remoto**: Gerenciador de aplicações remoto
- **Chatwoot**: Sistema de atendimento ao cliente
- **N8N**: Plataforma de automação de workflow
- **Evolution API**: API para WhatsApp

## 🏃‍♂️ Como Executar

### Modo de Desenvolvimento
```bash
npm run dev
```

### Modo de Produção
```bash
npm start
```

### Usando PM2

Para executar com PM2 (recomendado para produção):

```bash
# Instalar PM2 globalmente (se não tiver)
npm install -g pm2

# Iniciar a aplicação
npm run pm2:start

# Outros comandos úteis
npm run pm2:stop       # Parar a aplicação
npm run pm2:restart    # Reiniciar a aplicação
npm run pm2:status     # Ver status
npm run pm2:logs       # Ver logs
npm run pm2:monitor    # Monitor em tempo real
```

## 📁 Estrutura do Projeto

```
local/
├── public/             # Arquivos estáticos (frontend)
│   ├── css/           # Estilos CSS
│   ├── js/            # JavaScript do frontend
│   │   ├── components/
│   │   ├── config/
│   │   ├── services/
│   │   ├── templates/
│   │   └── utils/
│   └── index.html     # Página principal
├── server/            # Código do servidor (backend)
│   ├── config/        # Configurações do servidor
│   ├── middleware/    # Middlewares
│   ├── routes/        # Rotas da API
│   ├── services/      # Serviços
│   └── utils/         # Utilitários
├── scripts/           # Scripts de configuração
├── config.json        # Configurações (não commitado)
├── config.example.json # Template de configuração
└── ecosystem.config.js # Configuração do PM2
```

## 🌐 Acesso

Após executar a aplicação, acesse:
- **Local**: `http://localhost:3000` (ou a porta configurada)
- **Produção**: Conforme configurado no seu ambiente

## 🔧 Scripts Disponíveis

- `npm start` - Inicia a aplicação em modo produção
- `npm run dev` - Inicia em modo desenvolvimento
- `npm run pm2:start` - Inicia com PM2
- `npm run pm2:stop` - Para o PM2
- `npm run pm2:restart` - Reinicia o PM2
- `npm run pm2:status` - Status do PM2
- `npm run pm2:logs` - Logs do PM2
- `npm run pm2:monitor` - Monitor do PM2

## 🔐 Segurança

- O arquivo `config.json` contém informações sensíveis e não deve ser commitado
- Use o arquivo `config.example.json` como template
- Mantenha suas credenciais seguras e atualizadas

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para suporte e dúvidas, entre em contato através dos canais oficiais da Techify.