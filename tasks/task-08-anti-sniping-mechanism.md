# Task 08: Mecanismo de Anti-Sniping (+2 Minutos nos Minutos Finais)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

No comércio eletrônico e leilões presenciais, o _"Sniping"_ ocorre quando um bot ou participante malicioso envia um lance no último segundo do cronômetro para impedir que licitantes humanos consigam reagir e cobrir o valor.

O edital da Verzel exige uma regra estrita de **Anti-Sniping**:

> **Regra:** Se um lance válido for registrado nos **últimos 2 minutos** do pregão (`endTime - now <= 120 segundos`), o encerramento do lote (`endTime`) deve ser **automaticamente estendido em mais 2 minutos (+120 segundos)** a partir do término anterior.

O objetivo desta tarefa é plugar o cálculo e extensão de tempo dentro do fluxo de criação de lances e retornar para o cliente a informação de prorrogação.

---

## 🛠️ Arquivos a Modificar

1. `src/use-cases/createBid.ts` (Modificar)
2. `src/controllers/createBid.ts` (Modificar)

---

## 📐 Especificação Técnica

### 1. Lógica no `src/use-cases/createBid.ts`

Dentro da transação atômica do lance:

```typescript
const now = new Date()
const twoMinutesInMs = 2 * 60 * 1000 // 120.000 ms
const timeRemaining = lot.endTime.getTime() - now.getTime()

let timeExtended = false
let newEndTime = lot.endTime

// Se restarem menos de 2 minutos para o fim do lote:
if (timeRemaining <= twoMinutesInMs && timeRemaining > 0) {
  timeExtended = true
  // Prorroga em +2 minutos a partir do horário de término atual
  newEndTime = new Date(lot.endTime.getTime() + twoMinutesInMs)

  await tx.lot.update({
    where: { id: lot.id },
    data: {
      endTime: newEndTime,
    },
  })
}

return {
  bid,
  timeExtended,
  newEndTime,
}
```

### 2. Atualização do Controller `src/controllers/createBid.ts`

O controller deve retornar o status HTTP `201 Created` contendo o lance e a indicação de anti-sniping:

```json
{
  "bid": {
    "id": "uuid",
    "amount": 15000,
    "sequenceNumber": 3,
    "timestamp": "2026-10-30T21:40:00.000Z"
  },
  "antiSniping": {
    "extended": true,
    "newEndTime": "2026-10-30T21:44:00.000Z"
  }
}
```

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional:
   - Criar um lote que termina daqui a 1 minuto (60 segundos).
   - Enviar um lance válido.
   - Constatar que a resposta vem com `antiSniping.extended === true` e que o `endTime` do lote foi estendido em exatamente +2 minutos.
