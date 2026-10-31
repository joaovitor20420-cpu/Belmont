# Task 01: Repositório de Transações da Carteira (Ledger Contábil)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

No sistema de leilão, nenhuma alteração de saldo financeiro de usuário pode ocorrer de forma "solta". Toda movimentação (depósito, bloqueio de lance, devolução de lance ou débito de arremate) exige registro imutável em um **Ledger Contábil** representado pela tabela `wallet_transactions`.

O objetivo desta tarefa é construir a interface de repositório `WalletTransactionsRepository` e sua implementação com Prisma `PrismaWalletTransactionsRepository`.

---

## 🛠️ Arquivos a Criar

1. `src/repositories/walletTransactionsRepository.ts`
2. `src/repositories/prisma/prismaWalletTransactionsRepository.ts`

---

## 📐 Especificação Técnica

### 1. Interface `src/repositories/walletTransactionsRepository.ts`

Deve exportar a interface com os métodos necessários:

```typescript
import type { Prisma, WalletTransaction } from '@prisma/client'

export interface WalletTransactionsRepository {
  create(data: Prisma.WalletTransactionUncheckedCreateInput): Promise<WalletTransaction>
  findManyByUserId(userId: string): Promise<WalletTransaction[]>
}
```

### 2. Implementação `src/repositories/prisma/prismaWalletTransactionsRepository.ts`

Deve implementar a interface utilizando o Singleton do Prisma (`../../lib/prisma.js`):

- `create`: Insere um novo registro contábil na tabela `wallet_transactions`.
- `findManyByUserId`: Retorna o extrato ordenado decrescentemente por `createdAt` (`orderBy: { createdAt: 'desc' }`).

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita limpa:
   ```powershell
   npx.cmd tsc --noEmit
   ```
2. Lint limpo:
   ```powershell
   npm.cmd run lint
   ```
3. Formatação Prettier:
   ```powershell
   npm.cmd run format
   ```

---

## 🎯 Instruções para a IA Executora

- Utilize imports com extensão `.js` (padrão NodeNext ESM).
- Respeite a tipagem do Prisma (`WalletTransactionUncheckedCreateInput` permite passar `userId` diretamente sem abrir objeto `user: { connect }`).
