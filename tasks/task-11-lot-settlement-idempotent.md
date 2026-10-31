# Task 11: Rotina Idempotente de Liquidação e Encerramento de Lote (`POST /lots/:id/settle`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Quando o prazo de um lote expira (`now >= endTime`), o leilão deve ser oficialmente encerrado e liquidado.

### Regras Mandatórias de Negócio:

1. **Idempotência Estrita:** A liquidação pode ser acionada por um cron job em background, por um webhook ou manualmente pelo leiloeiro. **Rodar a liquidação 1 vez ou 100 vezes deve produzir exatamente o mesmo resultado**, sem nunca debitar duas vezes o vencedor ou duplicar recibos.
2. **Débito Financeiro Definitivo:**
   - O saldo que estava temporariamente travado no `balanceCommitted` do vencedor agora é consumido em definitivo:
     `balanceTotal -= finalAmount`
     `balanceCommitted -= finalAmount`
   - É gerada uma transação de extrato contábil `SETTLEMENT_DEBIT` em `wallet_transactions`.
3. **Selo Criptográfico do Lote (`lotSealHash`):**
   - É calculado o selo final do lote unindo metadados e o hash do último lance, gravando em `lots.lotSealHash`.
4. **Emissão de Recibo Oficial:**
   - Cria o registro na tabela `receipts` com código único compartilhável (ex: `REC-2026-XXXX`).
5. **Caso sem lances:** Se o lote encerrou sem lances, seu status vai para `ENDED`, sem vencedor e sem débito.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/repositories/receiptsRepository.ts` (Criar)
2. `src/repositories/prisma/prismaReceiptsRepository.ts` (Criar)
3. `src/use-cases/settleLot.ts` (Criar)
4. `src/use-cases/factories/makeSettleLotUseCase.ts` (Criar)
5. `src/controllers/settleLot.ts` (Criar)
6. `src/routes.ts` (Modificar — rota `POST /lots/:id/settle`)

---

## 📐 Especificação Técnica

### 1. `SettleLotUseCase`

Na transação ACID:

```typescript
// 1. Lock pessimista no Lote:
const lot = await tx.lot.findUnique({ where: { id: lotId } })
if (!lot) throw new ResourceNotFoundError()

// 2. Checagem de Idempotência:
if (lot.status === 'ENDED') {
  const existingReceipt = await tx.receipt.findUnique({ where: { lotId: lot.id } })
  return {
    alreadySettled: true,
    lot,
    receipt: existingReceipt,
  }
}

// 3. Se houver vencedor:
if (lot.currentWinnerId && lot.bidsCount > 0) {
  const winner = await tx.user.findUnique({ where: { id: lot.currentWinnerId } })

  // Converte saldo comprometido em débito real definitivo:
  const newTotal = winner.balanceTotal - lot.currentPrice
  const newCommitted = winner.balanceCommitted - lot.currentPrice

  await tx.user.update({
    where: { id: winner.id },
    data: {
      balanceTotal: newTotal,
      balanceCommitted: newCommitted,
    },
  })

  // Registra no extrato:
  await tx.walletTransaction.create({
    data: {
      userId: winner.id,
      lotId: lot.id,
      type: 'SETTLEMENT_DEBIT',
      amount: lot.currentPrice,
      balanceAfter: newTotal - newCommitted,
      description: `Liquidação de arremate do lote "${lot.title}"`,
    },
  })

  // Calcula o Selo Criptográfico Raiz:
  const lastBid = await tx.bid.findFirst({
    where: { lotId: lot.id },
    orderBy: { sequenceNumber: 'desc' },
  })

  const lotSealHash = calculateLotSealHash({
    lotId: lot.id,
    winnerId: winner.id,
    finalPrice: lot.currentPrice,
    totalBids: lot.bidsCount,
    lastBidHash: lastBid.bidHash,
  })

  // Atualiza lote:
  await tx.lot.update({
    where: { id: lot.id },
    data: {
      status: 'ENDED',
      lotSealHash,
    },
  })

  // Emite o Recibo com código amigável:
  const receiptCode = `REC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

  const receipt = await tx.receipt.create({
    data: {
      lotId: lot.id,
      winnerId: winner.id,
      code: receiptCode,
      finalAmount: lot.currentPrice,
      lotSealHash,
    },
  })

  return { alreadySettled: false, lot, receipt }
}
```

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional de Idempotência:
   - Chamar `POST /lots/:id/settle` uma vez -> Lote encerrado, débito realizado, recibo emitido.
   - Chamar `POST /lots/:id/settle` uma segunda vez -> Retorna `alreadySettled: true`, sem debitar novamente o usuário.
