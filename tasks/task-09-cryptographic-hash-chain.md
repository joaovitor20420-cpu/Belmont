# Task 09: Trilha de Auditoria Criptográfica com Hash Chain HMAC-SHA256

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Para garantir transparência radical e impossibilitar fraudes internas (como um administrador do banco alterando o valor de um lance, inserindo lances falsos no passado ou apagando participantes), a plataforma implementa uma **Hash Chain Criptográfica** baseada em **HMAC-SHA256**.

Cada lance registrado no lote forma um elo de uma corrente criptográfica:

- O 1º lance do lote tem `prevHash = "0".repeat(64)`.
- Cada lance subsequente carrega o hash exato do lance anterior (`prevHash = lastBid.bidHash`).
- O hash do lance atual (`bidHash`) é gerado aplicando HMAC-SHA256 sobre a concatenação canônica dos dados do lance e da chave secreta da aplicação (`JWT_SECRET` ou `AUDIT_SECRET`).

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/utils/cryptoAudit.ts` (Criar)
2. `src/use-cases/createBid.ts` (Modificar — integrar o cálculo criptográfico real)

---

## 📐 Especificação Técnica

### 1. Utilitário `src/utils/cryptoAudit.ts`

Implementar usando o módulo nativo `node:crypto`:

```typescript
import crypto from 'node:crypto'
import { env } from '../env.js'

export interface BidHashPayload {
  lotId: string
  sequenceNumber: number
  bidderId: string
  amount: bigint | number
  timestamp: Date | string
  prevHash: string
}

export function calculateBidHash(payload: BidHashPayload): string {
  const normalizedTimestamp =
    payload.timestamp instanceof Date
      ? payload.timestamp.toISOString()
      : new Date(payload.timestamp).toISOString()

  // Formato canônico determinístico
  const message = [
    payload.lotId,
    payload.sequenceNumber,
    payload.bidderId,
    payload.amount.toString(),
    normalizedTimestamp,
    payload.prevHash,
  ].join('|')

  return crypto.createHmac('sha256', env.JWT_SECRET).update(message).digest('hex')
}

export function calculateLotSealHash(params: {
  lotId: string
  winnerId: string | null
  finalPrice: bigint | number
  totalBids: number
  lastBidHash: string
}): string {
  const message = [
    params.lotId,
    params.winnerId || 'NO_WINNER',
    params.finalPrice.toString(),
    params.totalBids,
    params.lastBidHash,
  ].join('|')

  return crypto.createHmac('sha256', env.JWT_SECRET).update(message).digest('hex')
}
```

### 2. Integração no `CreateBidUseCase`

Na transação do lance:

1. Buscar o último lance do lote:
   ```typescript
   const lastBid = await tx.bid.findFirst({
     where: { lotId: lot.id },
     orderBy: { sequenceNumber: 'desc' },
   })
   ```
2. Definir o `prevHash`:
   ```typescript
   const prevHash = lastBid ? lastBid.bidHash : '0'.repeat(64)
   const sequenceNumber = lot.bidsCount + 1
   const timestamp = new Date()
   ```
3. Calcular o `bidHash`:
   ```typescript
   const bidHash = calculateBidHash({
     lotId: lot.id,
     sequenceNumber,
     bidderId: bidder.id,
     amount: BigInt(amountInCents),
     timestamp,
     prevHash,
   })
   ```
4. Salvar o lance com os hashes reais no banco.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional:
   - Criar 3 lances consecutivos no mesmo lote.
   - Inspecionar a tabela `bids` no banco:
     - Lance 1: `sequenceNumber = 1`, `prevHash = "000...000"`, `bidHash = "abc123..."`.
     - Lance 2: `sequenceNumber = 2`, `prevHash = "abc123..."`, `bidHash = "def456..."`.
     - Lance 3: `sequenceNumber = 3`, `prevHash = "def456..."`, `bidHash = "ghi789..."`.
   - Constatar o encadeamento matemático perfeito!
