# Task 12: Comprovante Oficial de Arremate Compartilhável (`GET /receipts/:code`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Após arrematar um lote, o vencedor e o leiloeiro têm acesso a um **Comprovante Oficial de Arremate** autenticado criptograficamente.
O comprovante possui uma URL pública com código legível (ex: `http://localhost:3333/receipts/REC-2026-A1B2C3`) que pode ser compartilhado por link com bancos, transportadoras de arte ou órgãos fiscais.

### Informações Contidas no Comprovante:

- Código de Autenticação (`REC-2026-XXXX`).
- Dados da Obra (Título, Artista, Imagem, Descrição).
- Dados do Vencedor (apenas dados LGPD: `publicCode: LIC-XXXX`, `maskedName: J*** V***`).
- Valor final de arremate formatado em Reais (R$).
- Data e hora exata da liquidação.
- **Selo de Autenticidade Criptográfica (`lotSealHash`)**: com link para o validador público de auditoria.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/use-cases/getReceiptByCode.ts` (Criar)
2. `src/use-cases/factories/makeGetReceiptByCodeUseCase.ts` (Criar)
3. `src/controllers/getReceiptByCode.ts` (Criar)
4. `src/routes.ts` (Modificar — rota pública `GET /receipts/:code`)

---

## 📐 Especificação Técnica

### 1. `GetReceiptByCodeUseCase`

- Recebe `code: string`.
- Busca no repositório de recibos com `include: { lot: true, winner: true }`.
- Se não encontrar, lança erro de recurso não encontrado (`404`).
- Mapeia o retorno respeitando a LGPD:
  ```typescript
  return {
    receipt: {
      code: receipt.code,
      settledAt: receipt.settledAt,
      finalAmountInCents: Number(receipt.finalAmount),
      finalAmountFormatted: `R$ ${(Number(receipt.finalAmount) / 100).toFixed(2)}`,
      lotSealHash: receipt.lotSealHash,
      lot: {
        id: receipt.lot.id,
        title: receipt.lot.title,
        artist: receipt.lot.artist,
        imageUrl: receipt.lot.imageUrl,
        totalBids: receipt.lot.bidsCount,
      },
      winner: {
        publicCode: receipt.winner.publicCode,
        maskedName: receipt.winner.maskedName,
      },
    },
  }
  ```

### 2. Rota em `src/routes.ts`

- Rota **Pública** (qualquer portador do link pode consultar e comprovar a autenticidade).
- Documentada no Swagger UI na tag `'Comprovantes'`.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste no Swagger ou navegador:
   - Acessar `GET /receipts/REC-2026-XXXX` e verificar a resposta completa sem vazamento de dados privados.
