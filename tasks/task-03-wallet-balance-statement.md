# Task 03: Extrato Financeiro & Consulta de Saldos (`GET /wallet/balance` e `GET /wallet/statement`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Os licitantes e leiloeiros precisam consultar seus saldos atuais (Total, Comprometido e Disponível) e visualizar o histórico detalhado de todas as suas transações (extrato contábil).

O objetivo desta tarefa é construir:

1. Caso de Uso `GetWalletBalanceUseCase`: calcula em tempo real `balanceTotal`, `balanceCommitted` e `balanceAvailable`.
2. Caso de Uso `GetWalletStatementUseCase`: busca todas as transações do usuário em ordem cronológica reversa via `WalletTransactionsRepository`.
3. Respectivas factories e controllers.
4. Endpoints protegidos `GET /wallet/balance` e `GET /wallet/statement`.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/use-cases/getWalletBalance.ts` (Criar)
2. `src/use-cases/getWalletStatement.ts` (Criar)
3. `src/use-cases/factories/makeGetWalletBalanceUseCase.ts` (Criar)
4. `src/use-cases/factories/makeGetWalletStatementUseCase.ts` (Criar)
5. `src/controllers/getWalletBalance.ts` (Criar)
6. `src/controllers/getWalletStatement.ts` (Criar)
7. `src/routes.ts` (Modificar)

---

## 📐 Especificação Técnica

### 1. `GetWalletBalanceUseCase`

- Recebe `userId: string`.
- Busca o usuário no `UsersRepository`.
- Se não encontrar, lança erro de recurso não encontrado.
- Calcula:
  - `balanceTotal: Number(user.balanceTotal)`
  - `balanceCommitted: Number(user.balanceCommitted)`
  - `balanceAvailable: Number(user.balanceTotal - user.balanceCommitted)`
- Retorna os 3 valores em números inteiros (centavos) e formatados em reais para exibição amigável.

### 2. `GetWalletStatementUseCase`

- Recebe `userId: string`.
- Chama `walletTransactionsRepository.findManyByUserId(userId)`.
- Converte os campos `BigInt` (`amount`, `balanceAfter`) para `Number`.
- Retorna `{ transactions: [...] }`.

### 3. Controllers & Rotas

- Ambas as rotas exigem autenticação (`onRequest: [verifyJwt]`).
- Documentadas na tag `'Carteira'` no Swagger UI.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita limpa: `npx.cmd tsc --noEmit`.
2. Lint limpo: `npm.cmd run lint`.
3. Teste funcional:
   - Fazer um depósito de R$ 50,00 (`5000` centavos).
   - Chamar `GET /wallet/balance` e verificar `balanceTotal: 5000`, `balanceCommitted: 0`, `balanceAvailable: 5000`.
   - Chamar `GET /wallet/statement` e verificar o registro do depósito com data e descrição.
