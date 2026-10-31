# Task 10: Verificador Público de Integridade Criptográfica (`GET /audit/verify/:lotId`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Um dos grandes diferenciais exigidos no desafio da Verzel é a capacidade de **qualquer cidadão ou auditor externo auditar a integridade de um lote sem precisar estar logado**.

O verificador:

1. Carrega todos os lances do lote ordenados por `sequenceNumber`.
2. Percorre a cadeia recalibrando o HMAC-SHA256 de cada elo a partir do elo gênesis (`000...000`).
3. Compara o hash calculado com o hash gravado no banco.
4. **Detecção de Fraude:** Se qualquer pessoa alterar manualmente o valor de um lance de R$ 500 para R$ 1000 diretamente no PostgreSQL via PgAdmin ou DBeaver, o verificador detecta instantaneamente e acusa:
   - `isValid: false`
   - `corruptedSequence: 2`
   - `reason: "Hash mismatch no lance #2: o encadeamento criptográfico foi violado!"`

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/use-cases/verifyLotAuditTrail.ts` (Criar)
2. `src/use-cases/factories/makeVerifyLotAuditTrailUseCase.ts` (Criar)
3. `src/controllers/verifyLotAuditTrail.ts` (Criar)
4. `src/routes.ts` (Modificar — rota pública `GET /audit/verify/:lotId`)

---

## 📐 Especificação Técnica

### 1. `VerifyLotAuditTrailUseCase`

- **Entrada:** `lotId: string`.
- **Fluxo:**
  1. Busca o lote e todos os seus lances:
     ```typescript
     const bids = await this.bidsRepository.findManyByLotId(lotId)
     ```
  2. Inicializa `expectedPrevHash = '0'.repeat(64)`.
  3. Itera de `i = 0` até `bids.length`:
     - Verifica se `bids[i].prevHash === expectedPrevHash`. Se diferente, quebra acusando quebra de sequência.
     - Recalcula o `expectedBidHash = calculateBidHash(...)`.
     - Verifica se `bids[i].bidHash === expectedBidHash`. Se diferente, acusa adulteração de dados.
     - Atualiza `expectedPrevHash = bids[i].bidHash`.
  4. Se o lote estiver com status `ENDED`:
     - Recalcula o `lotSealHash` e compara com o `lot.lotSealHash` salvo no banco.
- **Retorno:**
  ```json
  {
    "lotId": "uuid",
    "totalBidsChecked": 15,
    "isValid": true,
    "chainStatus": "VERIFIED_INTEGRAL",
    "lotSealVerified": true,
    "verifiedAt": "2026-10-30T21:40:00.000Z"
  }
  ```
  Ou, em caso de fraude detectada:
  ```json
  {
    "lotId": "uuid",
    "totalBidsChecked": 5,
    "isValid": false,
    "chainStatus": "TAMPERED_OR_CORRUPTED",
    "tamperedBid": {
      "sequenceNumber": 3,
      "reason": "HMAC mismatch: dados do lance foram adulterados externamente"
    }
  }
  ```

### 2. Rota Pública em `src/routes.ts`

- `GET /audit/verify/:lotId` (**Sem middleware de autenticação — aberto ao público e órgãos reguladores**).
- Tag `'Auditoria Criptográfica'` no Swagger.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional:
   - Em um lote com 3 lances legítimos, chamar `GET /audit/verify/:lotId` -> deve retornar `isValid: true`.
   - Modificar manualmente o `amount` de um lance no PostgreSQL (`UPDATE bids SET amount = 99999 WHERE sequenceNumber = 2;`).
   - Chamar `GET /audit/verify/:lotId` novamente -> deve acusar `isValid: false` com flag de adulteração no lance 2!
