
# Backend - Sistema Multi-Tenant de Agendamento para Salões

Backend Node.js com Express e MongoDB para sistema de agendamento multi-tenant.

## 🚀 Características

- **Multi-tenant**: Isolamento de dados por subdomínio
- **API RESTful**: Endpoints organizados por recursos
- **Validação**: Validação robusta com express-validator
- **Segurança**: Helmet, CORS, rate limiting
- **Email**: Sistema de notificações por email
- **Planos**: Diferentes limites por plano (basic, premium, enterprise)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis no .env
# Iniciar em desenvolvimento
npm run dev

# Iniciar em produção
npm start
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/salon-booking
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### MongoDB

O sistema requer MongoDB instalado e rodando. As coleções são criadas automaticamente.

## 📁 Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração MongoDB
├── middleware/
│   ├── tenantDetection.js   # Detecção de tenant
│   └── errorHandler.js      # Tratamento de erros
├── models/
│   ├── Tenant.js            # Modelo do tenant
│   ├── TenantService.js     # Modelo de serviços
│   └── TenantAppointment.js # Modelo de agendamentos
├── routes/
│   ├── tenantRoutes.js      # Rotas do tenant
│   ├── serviceRoutes.js     # Rotas de serviços
│   ├── appointmentRoutes.js # Rotas de agendamentos
│   └── authRoutes.js        # Rotas de autenticação
├── utils/
│   └── emailService.js      # Serviço de email
├── server.js                # Servidor principal
└── package.json
```

## 🔌 API Endpoints

### Tenants

```
GET    /api/tenants/current           # Dados do tenant atual
PUT    /api/tenants/current           # Atualizar tenant
PUT    /api/tenants/branding          # Atualizar branding
PUT    /api/tenants/working-hours     # Atualizar horários
GET    /api/tenants/dashboard-stats   # Estatísticas
```

### Serviços

```
GET    /api/services                  # Listar serviços
GET    /api/services/categories       # Listar categorias
GET    /api/services/popular/list     # Serviços populares
GET    /api/services/:id              # Buscar serviço
POST   /api/services                  # Criar serviço
PUT    /api/services/:id              # Atualizar serviço
DELETE /api/services/:id              # Deletar serviço
```

### Agendamentos

```
GET    /api/appointments              # Listar agendamentos
GET    /api/appointments/available-slots # Horários disponíveis
GET    /api/appointments/:id          # Buscar agendamento
POST   /api/appointments              # Criar agendamento
PUT    /api/appointments/:id          # Atualizar agendamento
PUT    /api/appointments/:id/cancel   # Cancelar agendamento
```

### Autenticação

```
POST   /api/auth/register             # Registrar admin
POST   /api/auth/login                # Login
GET    /api/auth/me                   # Usuário atual
POST   /api/auth/logout               # Logout
```

## 🏢 Sistema Multi-Tenant

### Detecção de Tenant

O sistema detecta o tenant através do subdomínio:

- **Produção**: `salao1.seudominio.com` → tenant: `salao1`
- **Desenvolvimento**: `localhost:5000?tenant=salao1` → tenant: `salao1`

### Isolamento de Dados

Todos os dados são isolados por `tenantId`:

```javascript
// Exemplo de query isolada
const services = await TenantService.find({ tenantId: req.tenant.subdomain })
```

## 📊 Planos e Limites

### Planos Disponíveis

- **Basic**: 10 serviços, 100 agendamentos/mês
- **Premium**: 50 serviços, 500 agendamentos/mês
- **Enterprise**: 200 serviços, 2000 agendamentos/mês

### Verificação de Limites

```javascript
// Middleware de verificação
app.use('/api/services', checkPlanLimits('services'))
app.use('/api/appointments', checkPlanLimits('appointments'))
```

## 📧 Sistema de Email

### Configuração SMTP

```javascript
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})
```

### Templates Disponíveis

- Confirmação de agendamento
- Lembrete de agendamento
- Cancelamento de agendamento

## 🛡️ Segurança

### Middlewares Aplicados

- **Helmet**: Headers de segurança
- **CORS**: Controle de origem cruzada
- **Rate Limiting**: Limitação de requests
- **Validation**: Validação de entrada
- **JWT**: Autenticação por token

### Validação de Dados

```javascript
// Exemplo de validação
body('email').isEmail().normalizeEmail(),
body('phone').matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
body('price').isFloat({ min: 0 })
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev     # Desenvolvimento com nodemon
npm start       # Produção
npm test        # Executar testes
```

### Estrutura de Resposta

```javascript
// Sucesso
{
  "success": true,
  "data": {...},
  "message": "Operação realizada com sucesso"
}

// Erro
{
  "success": false,
  "error": "Mensagem de erro",
  "errors": [...] // Detalhes de validação
}
```

## 🚀 Deploy

### Preparação para Produção

1. Configurar variáveis de ambiente
2. Configurar MongoDB
3. Configurar SMTP
4. Configurar domínio e SSL
5. Configurar proxy reverso (Nginx)

### Exemplo Nginx

```nginx
server {
    listen 80;
    server_name *.seudominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Logs e Monitoramento

O sistema inclui logs detalhados:

```javascript
console.log('✅ MongoDB conectado')
console.log('🚀 Servidor rodando na porta 5000')
console.error('❌ Erro:', error)
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
