# Thundera TV API

API backend do Thundera TV, desenvolvida com NestJS, Prisma e PostgreSQL. Responsável por autenticação, usuários, planos, assinaturas, pagamentos, controle de acesso ao stream e administração.

## Tecnologias

- [NestJS 12](https://docs.nestjs.com/) — framework backend
- [Prisma 7](https://www.prisma.io/) — ORM e migrations
- [PostgreSQL 16](https://www.postgresql.org/) — banco de dados
- JWT e Passport — autenticação
- bcryptjs — hash de senhas e refresh tokens
- class-validator — validação dos DTOs
- Jest e Supertest — testes

## Funcionalidades

- Cadastro, login, logout e renovação de sessão
- Perfil do usuário e gerenciamento de dispositivos
- Planos e assinaturas
- Registro e consulta de pagamentos
- Validação de acesso ao conteúdo de stream
- Informações sobre a versão do aplicativo
- Endpoints administrativos

## Pré-requisitos

- Node.js 20.19+ ou 22.12+
- npm
- PostgreSQL 16 ou Docker

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/thundera?schema=public"
JWT_SECRET="substitua-por-uma-chave-segura"
PORT=3000
```

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL de conexão com PostgreSQL |
| `JWT_SECRET` | Sim em produção | Chave usada para assinar access e refresh tokens |
| `PORT` | Não | Porta da API; padrão `3000` |

> Quando `JWT_SECRET` não é informado, a aplicação usa `development-secret-key`. Não use esse valor em produção.

## Banco de dados

### Com Docker

Inicie o PostgreSQL configurado pelo projeto:

```bash
docker compose up -d postgres
```

O banco ficará disponível em `localhost:5432` com:

- Banco: `thundera`
- Usuário: `postgres`
- Senha: `postgres`

### Migrations

Aplique as migrations existentes:

```bash
npx prisma migrate deploy
```

Para desenvolvimento, use:

```bash
npx prisma migrate dev
```

Para abrir o Prisma Studio:

```bash
npx prisma studio
```

## Executando a aplicação

```bash
# desenvolvimento
npm run start

# desenvolvimento com hot reload
npm run start:dev

# modo debug
npm run start:debug

# build
npm run build

# build compilado
npm run start:prod
```

A API será iniciada em `http://localhost:3000` por padrão.

## Endpoints

Os endpoints públicos e protegidos abaixo são relativos à porta configurada em `PORT`.

### Geral

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | Não | Status simples da aplicação |
| `GET` | `/app-version/latest` | Não | Retorna a versão mais recente disponível |

### Autenticação

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Não | Cadastra um usuário |
| `POST` | `/auth/login` | Não | Autentica e gera os tokens |
| `POST` | `/auth/refresh` | Não | Renova o access token |
| `POST` | `/auth/logout` | Bearer token | Revoga refresh tokens e, opcionalmente, um dispositivo |
| `GET` | `/auth/me` | Bearer token | Retorna o perfil autenticado |

Exemplo de cadastro:

```json
{
  "name": "Nome do usuário",
  "email": "usuario@email.com",
  "password": "senha123",
  "deviceId": "device-id-opcional",
  "platform": "android"
}
```

Exemplo de login:

```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "deviceId": "device-id-opcional",
  "platform": "android"
}
```

Endpoints protegidos recebem o header:

```http
Authorization: Bearer <accessToken>
```

### Usuários, planos e assinaturas

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/users/me` | Bearer token | Perfil do usuário |
| `GET` | `/plans` | Não | Lista os planos |
| `GET` | `/plans/:id` | Não | Consulta um plano |
| `POST` | `/plans` | Bearer token | Cria um plano |
| `GET` | `/subscriptions/me` | Bearer token | Lista as assinaturas do usuário |
| `POST` | `/subscriptions` | Bearer token | Cria uma assinatura para o usuário autenticado |

Exemplo de criação de plano:

```json
{
  "name": "Mensal",
  "description": "Acesso mensal",
  "price": 29.9,
  "durationDays": 30
}
```

Exemplo de criação de assinatura:

```json
{
  "planId": "uuid-do-plano"
}
```

### Pagamentos, stream e administração

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/payments/me` | Bearer token | Lista os pagamentos do usuário |
| `POST` | `/payments/webhook` | Não | Atualiza o status de um pagamento |
| `POST` | `/stream/check` | Bearer token | Verifica o acesso a um conteúdo |
| `GET` | `/admin/users` | Bearer token | Lista usuários |
| `GET` | `/admin/subscriptions` | Bearer token | Lista assinaturas |
| `GET` | `/admin/payments` | Bearer token | Lista pagamentos |
| `GET` | `/admin/stats` | Bearer token | Retorna estatísticas gerais |
| `PATCH` | `/admin/users/:id/status` | Bearer token | Atualiza o status de um usuário |

Exemplo do webhook de pagamento:

```json
{
  "externalReference": "referencia-do-pagamento",
  "status": "PAID",
  "provider": "provider-name"
}
```

Status aceitos: `PENDING`, `PAID`, `FAILED` e `REFUNDED`.

Exemplo de verificação de stream:

```json
{
  "contentId": "conteudo-123"
}
```

Exemplo de atualização de status administrativo:

```json
{
  "status": true
}
```

## Validação

A API usa `ValidationPipe` global com:

- Remoção de propriedades não declaradas no DTO
- Bloqueio de campos não permitidos
- Conversão automática dos valores

Requisições inválidas retornam erro HTTP `400` com os detalhes da validação.

## Testes

```bash
# testes unitários
npm run test

# testes unitários em modo watch
npm run test:watch

# cobertura
npm run test:cov

# testes end-to-end
npm run test:e2e

# lint
npm run lint

# formatar código
npm run format
```

## Estrutura

```text
src/
├── admin/           # Administração
├── app-version/     # Versão atual do aplicativo
├── auth/            # Autenticação, JWT e dispositivos
├── payments/        # Pagamentos e webhook
├── plans/           # Planos
├── prisma/          # Integração com PostgreSQL
├── stream/          # Verificação de acesso ao stream
├── subscriptions/   # Assinaturas
└── users/           # Perfil e dados do usuário
```

## Observabilidade

A aplicação ainda não registra o NestJS Observe. Para ambientes de produção, recomenda-se integrar o módulo oficial antes do deploy.

## Licença

Projeto privado — uso interno.
