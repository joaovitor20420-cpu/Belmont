# 🏛️ Architecture & Engineering Blueprint — Casa de Leilões Belmont

> **Projeto:** Casa de Leilões Online de Arte em Tempo Real com Trilha Criptográfica  
> **Processo Seletivo:** Verzel [ELITE DEV] Full Stack  
> **Candidato:** João Vitor Souza de Vasconcelos  
> **Versão da Arquitetura:** 1.0.0 (Back-End Core)

---

## 1. Visão Geral e Princípios Norteadores

A **Casa de Leilões Belmont** é uma plataforma de pregão de obras de arte em tempo real que combina alta performance HTTP, concorrência pessimista em lances, consistência contábil de saldos, conformidade estrita com a LGPD e uma **trilha de auditoria criptográfica baseada em Hash Chain (HMAC-SHA256)** que detecta adulterações, deleções ou inserções arbitrárias de lances no banco de dados sem depender de login.

### Princípios de Engenharia Adotados:

1. **Clean Architecture & SoC (Separation of Concerns):** A camada HTTP (Fastify) nunca conhece a camada de dados (Prisma). As regras de negócio residem exclusivamente em **Use Cases puros**.
2. **SOLID Estrito (com foco em SRP e DIP):**
   - **Single Responsibility Principle (SRP):** Cada Use Case realiza apenas uma única operação de negócio através do método `execute()`.
   - **Dependency Inversion Principle (DIP):** Os Use Cases dependem de **interfaces de repositórios** (`UsersRepository`, `LotsRepository`), viabilizando a injeção de repositórios em memória (_In-Memory Test Doubles_) nos testes unitários sem levantar banco de dados.
3. **Precisão Contábil (Sem Ponto Flutuante):** Todos os valores monetários são processados e armazenados em **centavos inteiros** com tipo `BigInt` (ex: R$ 150,00 vira `15000n`).
4. **Privacidade por Design (LGPD):** Nenhum dado pessoal identificável (CPF, e-mail ou nome completo) é exposto em salas de leilão ou APIs públicas. A pseudonimização é gerada no cadastro (`LIC-XXXX` e `J*** V***`).
5. **Fail-Fast & Validação Declarativa:** Validação estrita de variáveis de ambiente e payloads de entrada usando **Zod**, com tipagem inferida em tempo de compilação.

---

## 2. Stack Tecnológica e Infraestrutura

| Camada                   | Tecnologia                             | Versão                 | Justificativa Arquitetural                                                                                         |
| :----------------------- | :------------------------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Runtime**              | Node.js                                | `>= 24.16.0 LTS`       | Motor JavaScript V8 de alta performance e suporte nativo a ES Modules.                                             |
| **Linguagem**            | TypeScript                             | `^5.8.3`               | Tipagem estrita (`strict: true`, `noImplicitAny: true`, `module: NodeNext`).                                       |
| **Servidor Web**         | Fastify                                | `^5.12.7`              | Framework web Node.js com maior throughput de requisições por segundo e menor overhead de memória.                 |
| **Validação**            | Zod + fastify-type-provider-zod        | `^4.6.7` / `^7.0.0`    | Validação de schemas com conversão automática para especificações OpenAPI/JSON Schema.                             |
| **ORM & Migrations**     | Prisma ORM                             | `^6.19.3`              | Single source of truth via `schema.prisma`, tipagem estrita do banco e controle determinístico de migrations.      |
| **Banco de Dados**       | PostgreSQL                             | `15-alpine`            | Banco relacional robusto com suporte a locks pessimistas (`FOR UPDATE`), constraints atômicas e índices compostos. |
| **Infraestrutura Local** | Docker & Docker Compose                | Container `belmont-db` | Port mapping `5435:5432` evitando conflito com instâncias PostgreSQL locais do Windows.                            |
| **Autenticação**         | @fastify/jwt + @fastify/cookie         | `^10.2.5` / `^11.1.5`  | Emissão de tokens JWT assinados com transporte protegido em cookies `HttpOnly`, `SameSite=true` e `Secure`.        |
| **Criptografia & Hash**  | bcryptjs / node:crypto                 | `^3.0.3` / Nativo      | Hashing de senhas com custo 10 e geração HMAC-SHA256 para o selo da Hash Chain.                                    |
| **Documentação Viva**    | @fastify/swagger + @fastify/swagger-ui | `^9.9.2` / `^6.1.2`    | Swagger UI interativo servido automaticamente em `/docs`.                                                          |
| **Qualidade de Código**  | ESLint 10 + Prettier 3                 | Flat Config            | Código limpo padronizado (sem ponto e vírgula, aspas simples, indentação de 2 espaços).                            |

---

## 3. Topologia e Estrutura de Pastas

```text
casa-de-leiloes-online/
├── .env                              # Variáveis reais locais (gitignored)
├── .env.example                      # Template de variáveis obrigatórias
├── .gitignore                        # Blindagem de segredos e artefatos de build
├── .prettierrc                       # Regras de formatação Prettier
├── .prettierignore                   # Arquivos ignorados pelo Prettier
├── architecture.md                   # Este manifesto de arquitetura
├── docker-compose.yml                # Declaração do container PostgreSQL 15
├── eslint.config.js                  # Flat Config do ESLint com typescript-eslint
├── package.json                      # Scripts, dependências de produção e dev
├── progress.md                       # Roadmap e checklist de execução do projeto
├── tsconfig.json                     # Compilação estrita NodeNext
├── prisma/
│   ├── schema.prisma                 # Modelos do banco, enums, índices e relações
│   └── migrations/                   # Histórico versionado de scripts SQL
├── tasks/                            # Especificações atômicas para execução por IA
│   ├── README.md                     # Índice e instruções de execução das tasks
│   ├── task-01-wallet-repository-ledger.md
│   ├── task-02-wallet-deposit.md
│   ├── task-03-wallet-balance-statement.md
│   ├── task-04-art-institute-client.md
│   ├── task-05-art-cache-catalog.md
│   ├── task-06-lots-creation-listing.md
│   ├── task-07-bidding-engine-concurrency.md
│   ├── task-08-anti-sniping-mechanism.md
│   ├── task-09-cryptographic-hash-chain.md
│   ├── task-10-public-audit-verifier.md
│   ├── task-11-lot-settlement-idempotent.md
│   ├── task-12-official-receipt-shareable.md
│   └── task-13-realtime-sse-live-auction.md
└── src/
    ├── @types/                       # Extensões de tipagem do TypeScript
    │   └── fastify-jwt.d.ts          # Tipagem de claims do request.user
    ├── controllers/                  # Controladores finos HTTP (apenas parse e reply)
    │   ├── authenticateUser.ts       # POST /sessions (login e emissão de JWT)
    │   ├── profile.ts                # GET /me (dados do perfil logado)
    │   └── registerUser.ts           # POST /users (cadastro de usuário)
    ├── lib/                          # Instâncias compartilhadas e singletons
    │   └── prisma.ts                 # Singleton do PrismaClient com logs de dev
    ├── middlewares/                  # Interceptadores Fastify onRequest
    │   ├── verifyJwt.ts              # Validação de token em cabeçalho ou cookie
    │   └── verifyUserRole.ts         # Controle de acesso baseado em papéis (RBAC)
    ├── repositories/                 # Contratos (Interfaces) de persistência
    │   ├── usersRepositories.ts      # Interface UsersRepository
    │   └── prisma/                   # Implementações baseadas no Prisma ORM
    │       └── prismaUsersReporitory.ts
    ├── use-cases/                    # Casos de uso (Lógica de Negócio Pura)
    │   ├── authenticateUser.ts       # Validação de credenciais e match de senha
    │   ├── getUserProfile.ts         # Busca de usuário por ID
    │   ├── registerUser.ts           # Cadastro com hash e pseudonimização
    │   ├── errors/                   # Erros semânticos de domínio
    │   │   ├── invalid-credentials-error.ts
    │   │   └── user-already-exists-error.ts
    │   └── factories/                # Injeção de dependências (IoC manual)
    │       ├── makeAuthenticateUserUseCase.ts
    │       ├── makeGetUserProfileUseCase.ts
    │       └── makeRegisterUserUseCase.ts
    ├── utils/                        # Funções puras utilitárias
    │   ├── hash.ts                   # Bcrypt hashPassword e comparePassword
    │   └── lgpd.ts                   # maskName e generatePublicCode
    ├── env.ts                        # Validação fail-fast do process.env com Zod
    ├── routes.ts                     # Declaração e documentação de rotas com Swagger
    └── index.ts                      # Bootstrap do servidor Fastify e plugins
```

---

## 4. O Fluxo de Execução da Aplicação (Data Flow)

O ciclo de vida de uma requisição segue estritamente este fluxo unidirecional:

```text
  [ Cliente HTTP / Front-end / Swagger UI ]
                     │
                     ▼
             [ src/routes.ts ]  <─── Validação Zod & Documentação Swagger
                     │
                     ▼
             [ src/middlewares/ ] <─── Autenticação JWT & RBAC (se rota for protegida)
                     │
                     ▼
             [ src/controllers/ ] <─── Extrai body/params, chama Factory
                     │
                     ▼
             [ src/use-cases/factories/ ] <─── Instancia Repositório e Use Case
                     │
                     ▼
             [ src/use-cases/ ] <─── Regra de Negócio Pura, Lança Erros de Domínio
                     │
                     ▼
             [ src/repositories/ ] (Interface)
                     │
                     ▼
        [ src/repositories/prisma/ ] (Implementação)
                     │
                     ▼
              [ PostgreSQL 15 ] (Tabelas, Transações ACID, Locks)
```

---

## 5. Dicionário de Dados do Banco (PostgreSQL / Prisma)

### 5.1 Enums do Sistema:

- `UserRole`: `'AUCTIONEER'` (Leiloeiro) \| `'BIDDER'` (Licitante)
- `LoteStatus`: `'SCHEDULED'` \| `'LIVE'` \| `'ENDED'` \| `'CANCELLED'`
- `WalletTxType`: `'DEPOSIT'` \| `'BID_LOCK'` \| `'BID_RELEASE'` \| `'SETTLEMENT_DEBIT'` \| `'SETTLEMENT_CREDIT'`

### 5.2 Tabelas Principais:

1. **`users`**:
   - `id` (UUID PK), `name` (Texto), `email` (Unique), `document` (CPF Unique), `passwordHash` (Hash Bcrypt).
   - `role` (UserRole, default BIDDER).
   - `publicCode` (`LIC-XXXX` ou `LEI-XXXX`, Unique).
   - `maskedName` (`J*** V***`, pseudonimizado).
   - `balanceTotal` (`BigInt`, default 0).
   - `balanceCommitted` (`BigInt`, default 0).
   - _Saldo Disponível em Tempo Real:_ `balanceTotal - balanceCommitted`.

2. **`lots`**:
   - `id` (UUID PK), `title`, `description`, `imageUrl`, `artist` (Opcional), `externalApiId` (ID Art Institute of Chicago).
   - `startPrice`, `currentPrice`, `minIncrement` (todos `BigInt`).
   - `status` (`LoteStatus`, default SCHEDULED).
   - `startTime`, `endTime` (DateTime).
   - `lotSealHash` (Hash SHA256 gerado no encerramento selando todos os lances).
   - `bidsCount` (`Int`, default 0).
   - `currentWinnerId` (FK referenciando `users.id`).

3. **`bids`**:
   - `id` (UUID PK), `lotId` (FK `lots.id`), `bidderId` (FK `users.id`).
   - `amount` (`BigInt`).
   - `timestamp` (DateTime default now).
   - `sequenceNumber` (`Int` sequencial 1, 2, 3... por lote).
   - `prevHash` (Hash do lance anterior; `'0'.repeat(64)` para o 1º lance).
   - `bidHash` (HMAC-SHA256 do lance atual englobando o `prevHash`).
   - _Constraint Composta:_ `@@unique([lotId, sequenceNumber])` impedindo duplicidade ou corrida de sequência.

4. **`wallet_transactions`**:
   - `id` (UUID PK), `userId` (FK `users.id`), `lotId` (Opcional).
   - `type` (`WalletTxType`), `amount` (`BigInt`), `balanceAfter` (`BigInt`), `description` (Texto explicativo), `createdAt`.

5. **`receipts`**:
   - `id` (UUID PK), `lotId` (Unique FK `lots.id`), `winnerId` (FK `users.id`).
   - `code` (Unique, código alfanumérico público de validação).
   - `finalAmount` (`BigInt`), `lotSealHash` (Cópia imutável do selo do lote), `settledAt`.

6. **`external_items_cache`**:
   - `id` (Texto PK - ID do museu), `title`, `artist`, `dateDisplay`, `medium`, `dimensions`, `imageId`, `cachedAt`.

---

## 6. Regras de Negócio Fundamentais

### 6.1 Carteira Digital e Saldos (Módulo 4):

- `balanceTotal`: Todo o dinheiro depositado que pertence ao licitante.
- `balanceCommitted`: Montante temporariamente travado porque o usuário é o **líder provisório** de um ou mais lotes ativos.
- `balanceAvailable = balanceTotal - balanceCommitted`: Limite real que o usuário tem para dar novos lances.
- **Depósito:** Incrementa `balanceTotal`, gera `WalletTransaction` do tipo `DEPOSIT`. Operação atômica em transação.

### 6.2 Catálogo do Art Institute of Chicago (Módulo 5):

- Endpoint externo: `https://api.artic.edu/api/v1/artworks/search`.
- Montagem de Imagem IIIF: `https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`.
- Timeout de 3.5 segundos via `AbortController` com fallback transparente para o cache local `external_items_cache`.
- Apenas obras em **domínio público** (`is_public_domain: true`) são elegíveis para loteamento.

### 6.3 Motor de Lances Concorrentes & Anti-Sniping (Módulo 6):

- **Lock Pessimista:** Toda submissão de lance abre transação e executa `SELECT * FROM lots WHERE id = $1 FOR UPDATE`. Nenhuma leitura suja ou colisão de preço ocorre.
- **Validações:**
  - O lote deve estar com status `LIVE` e dentro da janela `startTime <= now <= endTime`.
  - O licitante não pode ser o leiloeiro criador do lote.
  - O licitante não pode cobrir o próprio lance (auto-cobertura proibida).
  - O valor deve ser `>= currentPrice + minIncrement`.
  - O licitante deve ter `balanceAvailable >= valorDoLance`.
- **Movimentação Atômica de Saldo:**
  - Se havia um líder anterior: seu `balanceCommitted` é imediatamente subtraído pelo valor do lance superado, e é gerada uma transação `BID_RELEASE`.
  - Para o novo líder: seu `balanceCommitted` é incrementado pelo valor do novo lance, gerando uma transação `BID_LOCK`.
- **Mecanismo de Anti-Sniping:**
  - Se um lance for confirmado nos últimos 120 segundos (`endTime - now <= 2 minutos`), o `endTime` é automaticamente estendido em **+120 segundos**.

### 6.4 Trilha de Auditoria Criptográfica (Módulo 7):

- **Fórmula do Hash do Lance:**
  $$\text{bidHash} = \text{HMAC-SHA256}(\text{chaveSecreta}, \text{lotId} + \text{sequenceNumber} + \text{bidderId} + \text{amount} + \text{timestamp} + \text{prevHash})$$
- **Selo Raiz do Lote (`lotSealHash`):**
  Ao finalizar o lote, o hash do último lance é combinado com os metadados finais de arremate, selando o lote.
- **Verificador Público:**
  Um endpoint público sem autenticação recalcula toda a cadeia de hashes do lote em tempo real. Se qualquer linha do banco sofrer alteração manual via SQL direto, deleção ou injeção, a checagem falha na hora apontando o número da sequência violada.

### 6.5 Liquidação Idempotente e Comprovantes (Módulo 8):

- Ao encerrar o pregão:
  - O saldo comprometido do vencedor é convertido em débito real (`balanceTotal -= finalAmount`, `balanceCommitted -= finalAmount`), gerando `SETTLEMENT_DEBIT`.
  - O lote transiciona para `ENDED`.
  - É emitido o `Receipt` contendo código único autenticado (ex: `REC-2026-XXXX`).
  - Idempotência: rodar o encerramento múltiplas vezes nunca debita duas vezes o usuário nem gera recibos duplicados.

---

## 7. Protocolo de Implementação das Tasks (Instruções para IAs Executoras)

Toda IA (Claude, Gemini Argon) responsável por executar as tarefas contidas na pasta `tasks/` deve seguir impreterivelmente:

1. **Nunca quebrar a compilação:** O comando `npx.cmd tsc --noEmit` deve terminar com código 0 após cada task.
2. **Respeitar o Linter:** Rodar `npm.cmd run lint` e garantir 0 erros e 0 warnings.
3. **Respeitar as ES Modules do Node:** Todos os imports relativos em arquivos TypeScript devem obrigatoriamente carregar a extensão `.js` (ex: `import { prisma } from '../lib/prisma.js'`).
4. **Isolamento de Camadas:** Nunca instanciar PrismaClient dentro de Controllers. Toda comunicação de banco passa por interfaces de repositórios injetadas no Use Case.
5. **Swagger Sempre Atualizado:** Toda nova rota adicionada em `src/routes.ts` deve conter tags descritivas, sumário e schemas Zod para validação automática de entrada e renderização no Swagger UI (`/docs`).
