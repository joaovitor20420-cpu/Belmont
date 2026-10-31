# Task 02: Caso de Uso de Depósito Simulado & Endpoint `POST /wallet/deposit`

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Licitantes precisam depositar fundos simulados em suas carteiras para poderem participar dos leilões e darem lances.

O objetivo desta tarefa é construir:

1. O Caso de Uso `DepositUseCase` com transação ACID no PostgreSQL (atualiza `balanceTotal` do usuário e gera o registro `DEPOSIT` em `wallet_transactions` na mesma transação atômica).
2. A Factory `makeDepositUseCase`.
3. O Controller `depositController` com validação de entrada Zod.
4. A rota protegida por JWT `POST /wallet/deposit` documentada no Swagger.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/use-cases/deposit.ts` (Criar)
2. `src/use-cases/factories/makeDepositUseCase.ts` (Criar)
3. `src/controllers/deposit.ts` (Criar)
4. `src/routes.ts` (Modificar — plugar `POST /wallet/deposit`)

---

## 📐 Especificação Técnica

### 1. Caso de Uso `src/use-cases/deposit.ts`

- **Entrada:** `userId: string`, `amountInCents: number`.
- **Validações:**
  - `amountInCents` deve ser inteiro positivo (`> 0`).
  - Usuário deve existir no banco (`UsersRepository.findById`). Caso contrário, lançar erro semântico.
- **Atomicidade Financeira (ACID):**
  - Utilizar `prisma.$transaction(async (tx) => { ... })`.
  - Incrementar `balanceTotal`: `newBalanceTotal = user.balanceTotal + BigInt(amountInCents)`.
  - Criar `walletTransaction` com:
    - `userId: userId`
    - `type: 'DEPOSIT'`
    - `amount: BigInt(amountInCents)`
    - `balanceAfter: newBalanceTotal`
    - `description: "Depósito simulado de R$ ${(amountInCents / 100).toFixed(2)}"`
- **Retorno:**
  - `balanceTotal: number` (convertido de BigInt)
  - `balanceAvailable: number` (`Number(updatedUser.balanceTotal - updatedUser.balanceCommitted)`)

### 2. Factory `src/use-cases/factories/makeDepositUseCase.ts`

- Instancia `new DepositUseCase(new PrismaUsersRepository())`.

### 3. Controller `src/controllers/deposit.ts`

- Valida o body com Zod:
  ```typescript
  const depositBodySchema = z.object({
    amountInCents: z.number().int().positive('O valor deve ser positivo e em centavos'),
  })
  ```
- Executa o use case passando `userId: request.user.sub` e `amountInCents`.
- Responde com status HTTP `200 OK`.

### 4. Rota em `src/routes.ts`

- Registrar com hook `onRequest: [verifyJwt]`.
- Configurar schema para Swagger UI:
  - `tags: ['Carteira']`
  - `summary: 'Depositar saldo na carteira'`
  - `description: 'Adiciona saldo simulado em centavos (ex: 5000 para R$ 50,00)'`

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste via Swagger UI (`http://localhost:3333/docs`) ou PowerShell:
   ```powershell
   # Autenticado com token retornado do login
   Invoke-RestMethod -Uri "http://localhost:3333/wallet/deposit" -Method Post -Headers @{ Authorization = "Bearer " + $token } -ContentType "application/json" -Body '{"amountInCents": 100000}'
   ```
   Deve retornar:
   ```json
   {
     "balanceTotal": 100000,
     "balanceAvailable": 100000
   }
   ```
4. Verificação no banco de dados: O registro deve aparecer na tabela `wallet_transactions` com tipo `DEPOSIT`.
