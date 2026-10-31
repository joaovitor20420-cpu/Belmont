# Task 06: Repositório de Lotes, Criação de Lotes por Leiloeiro & Vitrine Pública

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Lotes representam os itens em leilão.
Regras de negócio cruciais:

1. **Apenas usuários com papel `AUCTIONEER` (Leiloeiro)** podem criar lotes (`POST /lots`). O middleware `verifyUserRole('AUCTIONEER')` deve proteger esse endpoint.
2. Todo lote possui:
   - `startPrice` (em centavos via `BigInt`)
   - `currentPrice` (inicialmente igual a `startPrice`)
   - `minIncrement` (incremento mínimo obrigatório por lance, ex: R$ 10,00 -> `1000n`)
   - `startTime` e `endTime` (datas de início e término do pregão)
   - `status`: `SCHEDULED` (agendado), `LIVE` (ao vivo), `ENDED` (encerrado), `CANCELLED` (cancelado)
3. A vitrine de lotes (`GET /lots`) deve ser **pública**, permitindo filtrar por status (`SCHEDULED`, `LIVE`, `ENDED`).

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/repositories/lotsRepository.ts` (Criar)
2. `src/repositories/prisma/prismaLotsRepository.ts` (Criar)
3. `src/use-cases/createLot.ts` (Criar)
4. `src/use-cases/listLots.ts` (Criar)
5. `src/use-cases/getLotDetails.ts` (Criar)
6. `src/use-cases/factories/makeCreateLotUseCase.ts` (Criar)
7. `src/use-cases/factories/makeListLotsUseCase.ts` (Criar)
8. `src/use-cases/factories/makeGetLotDetailsUseCase.ts` (Criar)
9. `src/controllers/createLot.ts` (Criar)
10. `src/controllers/listLots.ts` (Criar)
11. `src/controllers/getLotDetails.ts` (Criar)
12. `src/routes.ts` (Modificar)

---

## 📐 Especificação Técnica

### 1. Interface `LotsRepository`

```typescript
import type { Lot, LoteStatus, Prisma } from '@prisma/client'

export interface LotsRepository {
  create(data: Prisma.LotUncheckedCreateInput): Promise<Lot>
  findById(id: string): Promise<Lot | null>
  findMany(params: { status?: LoteStatus; page?: number; limit?: number }): Promise<Lot[]>
  update(id: string, data: Prisma.LotUpdateInput): Promise<Lot>
}
```

### 2. `CreateLotUseCase`

- Validações:
  - `startTime` deve ser anterior a `endTime`.
  - `startPrice` e `minIncrement` devem ser positivos em centavos.
  - Verifica se o autor da requisição tem role `AUCTIONEER`.
- Se `startTime <= now < endTime`, pode definir status como `LIVE`; se futuro, `SCHEDULED`.
- Grava `userId` do leiloeiro criador.

### 3. Rotas & Swagger

- `POST /lots` (protegida com `onRequest: [verifyJwt, verifyUserRole('AUCTIONEER')]`).
- `GET /lots?status=LIVE&page=1` (pública).
- `GET /lots/:id` (pública, retorna dados do lote e histórico resumido).
- Documentadas na tag `'Lotes'` no Swagger.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste funcional no Swagger:
   - Fazer login com usuário `AUCTIONEER` e criar um lote.
   - Tentar criar lote com usuário `BIDDER` e receber **403 Forbidden**.
   - Listar os lotes criados com `GET /lots`.
