# Task 07: Motor de Lances com Locks Pessimistas ACID & Bloqueio/Liberação de Saldo

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Esta tarefa implementa o **coração do desafio técnico da Verzel**: o motor de lances concorrentes.
Em um leilão de alta demanda, múltiplos licitantes podem enviar lances simultaneamente no mesmo milissegundo.

### Regras Mandatórias de Negócio:

1. **Lock Pessimista no Banco:** Para evitar condições de corrida (Race Conditions), a validação e o registro do lance devem ser executados dentro de uma transação PostgreSQL com **`SELECT * FROM lots WHERE id = $1 FOR UPDATE`**.
2. **Validações Estritas de Lance:**
   - O lote deve existir e estar com status `LIVE`.
   - O momento do lance deve ser anterior ao `endTime`.
   - **Auto-cobertura proibida:** O usuário que já é o líder atual (`currentWinnerId`) **não pode dar novo lance** sobre o seu próprio lance líder.
   - **Incremento Mínimo:** O valor do lance deve ser `>= currentPrice + minIncrement`.
   - **Saldo Disponível:** O licitante deve possuir `balanceAvailable >= valorDoLance`.
3. **Movimentação Atômica de Saldos e Ledger:**
   - **Líder Anterior:** Se já existia um líder diferente, o valor do lance que ele havia comprometido deve ser **desbloqueado imediatamente** (`balanceCommitted -= lanceAnterior`), registrando uma transação `BID_RELEASE` na tabela `wallet_transactions`.
   - **Novo Líder:** O valor do novo lance deve ser **bloqueado** na carteira do novo líder (`balanceCommitted += novoLance`), registrando uma transação `BID_LOCK` em `wallet_transactions`.
   - O lote deve ter seu `currentPrice` e `currentWinnerId` atualizados, e `bidsCount` incrementado em +1.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/repositories/bidsRepository.ts` (Criar)
2. `src/repositories/prisma/prismaBidsRepository.ts` (Criar)
3. `src/use-cases/createBid.ts` (Criar)
4. `src/use-cases/factories/makeCreateBidUseCase.ts` (Criar)
5. `src/controllers/createBid.ts` (Criar)
6. `src/routes.ts` (Modificar — rota `POST /lots/:id/bids`)

---

## 📐 Especificação Técnica

### 1. Interface `BidsRepository`

```typescript
import type { Bid, Prisma } from '@prisma/client'

export interface BidsRepository {
  create(data: Prisma.BidUncheckedCreateInput): Promise<Bid>
  findLastBidByLotId(lotId: string): Promise<Bid | null>
  findManyByLotId(lotId: string): Promise<Bid[]>
}
```

### 2. Transação Interativa no `CreateBidUseCase`

O Use Case deve utilizar a transação interativa do Prisma (`prisma.$transaction(async (tx) => { ... })`):

```typescript
// 1. Lock pessimista no Lote:
const lotRaw = await tx.$queryRaw<Lot[]>`
  SELECT * FROM lots WHERE id = ${lotId} FOR UPDATE
`
const lot = lotRaw[0]
if (!lot) throw new ResourceNotFoundError()

// 2. Validações de status, horário, auto-cobertura e incremento mínimo:
const now = new Date()
if (lot.status !== 'LIVE' || now > lot.endTime) {
  throw new AuctionNotActiveError()
}

if (lot.currentWinnerId === bidderId) {
  throw new SelfOutbidError('Você já é o líder atual deste lote.')
}

const minAcceptableAmount =
  lot.bidsCount === 0 ? lot.startPrice : lot.currentPrice + lot.minIncrement
if (BigInt(amountInCents) < minAcceptableAmount) {
  throw new InvalidBidAmountError(
    `O lance mínimo aceitável é de R$ ${(Number(minAcceptableAmount) / 100).toFixed(2)}`,
  )
}

// 3. Verificação do saldo do licitante com Lock:
const bidderRaw = await tx.$queryRaw<User[]>`
  SELECT * FROM users WHERE id = ${bidderId} FOR UPDATE
`
const bidder = bidderRaw[0]
const balanceAvailable = bidder.balanceTotal - bidder.balanceCommitted

if (balanceAvailable < BigInt(amountInCents)) {
  throw new InsufficientFundsError('Saldo disponível insuficiente para cobrir o lance.')
}

// 4. Liberação do líder anterior (se houver):
if (lot.currentWinnerId) {
  const previousLeader = await tx.user.findUnique({ where: { id: lot.currentWinnerId } })
  if (previousLeader) {
    const releasedCommitted = previousLeader.balanceCommitted - lot.currentPrice
    await tx.user.update({
      where: { id: previousLeader.id },
      data: { balanceCommitted: releasedCommitted },
    })

    await tx.walletTransaction.create({
      data: {
        userId: previousLeader.id,
        lotId: lot.id,
        type: 'BID_RELEASE',
        amount: lot.currentPrice,
        balanceAfter: previousLeader.balanceTotal - releasedCommitted,
        description: `Saldo liberado: lance superado no lote "${lot.title}"`,
      },
    })
  }
}

// 5. Bloqueio do novo líder:
const newCommitted = bidder.balanceCommitted + BigInt(amountInCents)
await tx.user.update({
  where: { id: bidder.id },
  data: { balanceCommitted: newCommitted },
})

await tx.walletTransaction.create({
  data: {
    userId: bidder.id,
    lotId: lot.id,
    type: 'BID_LOCK',
    amount: BigInt(amountInCents),
    balanceAfter: bidder.balanceTotal - newCommitted,
    description: `Saldo bloqueado: liderança provisória no lote "${lot.title}"`,
  },
})

// 6. Registro do Lance e atualização do Lote:
const nextSequence = lot.bidsCount + 1
// (prevHash e bidHash serão aprofundados na Task 09 da Trilha Criptográfica)
const bid = await tx.bid.create({
  data: {
    lotId: lot.id,
    bidderId: bidder.id,
    amount: BigInt(amountInCents),
    sequenceNumber: nextSequence,
    prevHash: '0'.repeat(64), // placeholder antes da Task 09
    bidHash: '0'.repeat(64),
  },
})

await tx.lot.update({
  where: { id: lot.id },
  data: {
    currentPrice: BigInt(amountInCents),
    currentWinnerId: bidder.id,
    bidsCount: nextSequence,
  },
})
```

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita limpa: `npx.cmd tsc --noEmit`.
2. Lint limpo: `npm.cmd run lint`.
3. Teste funcional no Swagger UI (`POST /lots/:id/bids`):
   - Licitante 1 dá lance válido -> saldo é bloqueado (`BID_LOCK`).
   - Licitante 1 tenta dar outro lance em seguida -> erro de auto-cobertura.
   - Licitante 2 dá lance superior -> saldo do Licitante 1 é liberado (`BID_RELEASE`) e do Licitante 2 é bloqueado.
