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
- Yarn 1.22.22
- PostgreSQL 16 ou Docker

## Instalação

```bash
yarn install --frozen-lockfile
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
yarn prisma migrate deploy
```

Para desenvolvimento, use:

```bash
yarn prisma migrate dev
```

Para abrir o Prisma Studio:

```bash
yarn prisma studio
```

## Executando a aplicação

```bash
# desenvolvimento
yarn start

# desenvolvimento com hot reload
yarn start:dev

# modo debug
yarn start:debug

# build
yarn build

# build compilado
yarn start:prod
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
| `GET` | `/admin/users` | Bearer + `admin.users.read` | Lista usuários |
| `GET` | `/admin/subscriptions` | Bearer + `admin.subscriptions.read` | Lista assinaturas |
| `GET` | `/admin/payments` | Bearer + `admin.payments.read` | Lista pagamentos |
| `GET` | `/admin/stats` | Bearer + `admin.stats.read` | Retorna estatísticas gerais |
| `PATCH` | `/admin/users/:id/status` | Bearer + `admin.users.status.update` | Atualiza o status de um usuário |
| `PATCH` | `/admin/users/:id/role` | Bearer + `admin.users.role.update` | Define o papel USER ou ADMIN |
| `GET` | `/admin/roles/:role/permissions` | Bearer + `authorization.permissions.read` | Consulta permissões de um papel |
| `PUT` | `/admin/roles/:role/permissions` | Bearer + `authorization.permissions.manage` | Substitui permissões de USER ou ADMIN |

As permissões são associadas a papéis no banco. `ADMIN` recebe permissões operacionais; apenas `SUPER_ADMIN` pode alterar a matriz ou promover usuários. A API não permite alterar as permissões de `SUPER_ADMIN`, atribuir o papel `SUPER_ADMIN` ou delegar as permissões `admin.users.role.update` e `authorization.permissions.manage`.

Para substituir as permissões de `ADMIN`, envie ao endpoint `PUT /admin/roles/ADMIN/permissions`:

```json
{
  "permissions": ["admin.users.read", "admin.users.status.update"]
}
```

Para promover um usuário existente, um `SUPER_ADMIN` pode enviar `PATCH /admin/users/:id/role` com:

```json
{
  "role": "ADMIN"
}
```

Para criar o primeiro `SUPER_ADMIN`, cadastre a conta normalmente e altere o papel por uma conexão administrativa segura ao banco:

```sql
UPDATE "User"
SET "role" = 'SUPER_ADMIN'::"UserRole"
WHERE "email" = lower('admin@seudominio.com')
RETURNING "id", "email", "role";
```

Confirme que a conta retornada é a esperada. Depois, use essa conta para promover usuários a `ADMIN` e administrar as permissões dos papéis `USER` e `ADMIN`. As chaves de permissões aceitas pela API são definidas no código; adicionar uma chave nova requer uma alteração de código e migration, mas mudar quais papéis recebem as permissões existentes não exige deploy.

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
yarn test

# testes unitários em modo watch
yarn test:watch

# cobertura
yarn test:cov

# testes end-to-end
yarn test:e2e

# lint
yarn lint

# formatar código
yarn format
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
