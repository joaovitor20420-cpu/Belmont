# Task 13: Streaming em Tempo Real com Server-Sent Events (SSE) da Sala de Pregão (`GET /lots/:id/live`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Em uma Casa de Leilões online, os licitantes não podem ficar recarregando a página via F5 para saber se foram superados ou se o cronômetro foi estendido.
O edital da Verzel exige atualizações instantâneas da sala de pregão.

Para isso, implementamos um canal **SSE (Server-Sent Events)** nativo via Fastify no endpoint `GET /lots/:id/live`.
Sempre que um novo lance for aceito, o anti-sniping disparar ou o lote for liquidado, todos os navegadores conectados na sala recebem o evento no mesmo milissegundo.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/lib/auctionEvents.ts` (Criar — Barramento de Eventos EventEmitter em memória)
2. `src/controllers/liveAuctionStream.ts` (Criar — Handler SSE Fastify)
3. `src/use-cases/createBid.ts` (Modificar — emitir evento de novo lance)
4. `src/use-cases/settleLot.ts` (Modificar — emitir evento de encerramento)
5. `src/routes.ts` (Modificar — rota `GET /lots/:id/live`)

---

## 📐 Especificação Técnica

### 1. Barramento de Eventos `src/lib/auctionEvents.ts`

Utilizar o `EventEmitter` nativo do Node.js:

```typescript
import { EventEmitter } from 'node:events'

class AuctionEventsEmitter extends EventEmitter {}

export const auctionEvents = new AuctionEventsEmitter()

// Tipos de Eventos:
export type AuctionEventPayload =
  | {
      type: 'NEW_BID'
      lotId: string
      currentPrice: number
      minNextBid: number
      bidsCount: number
      leaderPublicCode: string
      leaderMaskedName: string
      antiSnipingExtended: boolean
      newEndTime: string
    }
  | {
      type: 'LOT_SETTLED'
      lotId: string
      finalPrice: number
      winnerPublicCode: string
      winnerMaskedName: string
      receiptCode: string
    }
```

### 2. Controller SSE `src/controllers/liveAuctionStream.ts`

- Configura os cabeçalhos HTTP de SSE:
  ```typescript
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform')
  reply.raw.setHeader('Connection', 'keep-alive')
  reply.raw.setHeader('Access-Control-Allow-Origin', '*')
  ```
- Envia mensagem inicial de handshake:
  ```typescript
  reply.raw.write(`event: connected\ndata: ${JSON.stringify({ lotId })}\n\n`)
  ```
- Ouve o evento no `auctionEvents`:
  ```typescript
  const onAuctionUpdate = (event: AuctionEventPayload) => {
    if (event.lotId === lotId) {
      reply.raw.write(`event: update\ndata: ${JSON.stringify(event)}\n\n`)
    }
  }

  auctionEvents.on('update', onAuctionUpdate)
  ```
- Trata desconexão do cliente (`request.raw.on('close')`) para remover o listener e evitar memory leaks!

### 3. Integração nos Use Cases

- No `createBid.ts`, após a transação bem-sucedida, disparar:
  ```typescript
  auctionEvents.emit('update', {
    type: 'NEW_BID',
    lotId: lot.id,
    currentPrice: Number(bid.amount),
    minNextBid: Number(bid.amount + lot.minIncrement),
    bidsCount: lot.bidsCount + 1,
    leaderPublicCode: bidder.publicCode,
    leaderMaskedName: bidder.maskedName,
    antiSnipingExtended: timeExtended,
    newEndTime: newEndTime.toISOString(),
  })
  ```

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional:
   - Abrir o navegador em `http://localhost:3333/lots/{lotId}/live` -> a conexão permanece aberta recebendo stream.
   - Em outra aba, enviar um lance para o lote.
   - A aba do stream deve imprimir o evento `NEW_BID` instantaneamente!
