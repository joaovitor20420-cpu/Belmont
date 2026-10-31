# 📋 Guia de Execução de Tasks — Casa de Leilões Belmont

Este diretório contém a decomposição atômica de todas as tarefas de engenharia necessárias para implementar o Back-End da **Casa de Leilões Belmont (Verzel Elite Dev)**, cobrindo do **Módulo 4 ao Módulo 8**.

Cada arquivo `task-XX-*.md` é um **prompt executável autônomo e detalhado**, projetado para ser alimentado diretamente para assistentes de código de IA (Claude, Gemini Argon) ou executado passo a passo por você.

---

## 🗺️ Mapa de Dependência das Tasks

```text
[MÓDULO 4: CARTEIRA DIGITAL]
  Task 01: Repositório de Transações da Carteira (Ledger)
    └── Task 02: Caso de Uso de Depósito Simulado (POST /wallet/deposit)
          └── Task 03: Extrato Financeiro & Consulta de Saldos (GET /wallet/balance, GET /wallet/statement)

[MÓDULO 5: API ART INSTITUTE OF CHICAGO]
  Task 04: Client HTTP Resiliente da API de Arte (Timeout 3.5s & IIIF)
    └── Task 05: Cache Local PostgreSQL & Catálogo de Obras (GET /artworks/search, GET /artworks/:id)

[MÓDULO 6: MOTOR DE LANCES & CONCORRÊNCIA]
  Task 06: Repositório e Criação/Listagem de Lotes (POST /lots, GET /lots)
    └── Task 07: Motor de Lances Concorrentes com Lock Pessimista ACID (POST /lots/:id/bids)
          └── Task 08: Mecanismo de Anti-Sniping (+2 min nos 2 min finais)

[MÓDULO 7: TRILHA DE AUDITORIA CRIPTOGRÁFICA]
  Task 09: Hash Chain HMAC-SHA256 nos Lances e Selo Raiz do Lote
    └── Task 10: Verificador Público de Integridade Criptográfica (GET /audit/verify/:lotId)

[MÓDULO 8: ENCERRAMENTO, LIQUIDAÇÃO & SSE]
  Task 11: Rotina Idempotente de Liquidação e Encerramento (POST /lots/:id/settle)
    └── Task 12: Comprovante Oficial de Arremate Compartilhável (GET /receipts/:code)
    └── Task 13: Streaming em Tempo Real (Server-Sent Events) da Sala de Pregão (GET /lots/:id/live)
```

---

## 🚦 Prompt Padrão de Execução para IAs (Claude / Gemini Argon)

Para executar qualquer tarefa deste repositório com o Claude ou o Gemini Argon, copie e cole o seguinte comando:

> **"Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita em `tasks/task-XX-nome-da-tarefa.md`."**

---

## 🛡️ Regras Estritas de Execução para IAs

Ao executar qualquer task deste diretório, a IA DEVE seguir impreterivelmente:

1. **Clean Architecture Obrigatória:**
   - Controllers **nunca** importam `prisma` diretamente.
   - Todo acesso ao banco passa por uma **Interface de Repositório** injetada no Use Case.
   - Use Cases possuem responsabilidade única com método `execute()`.
   - Factories instanciam repositórios e Use Cases para os Controllers.
2. **ES Modules (`type: module`):**
   - Todos os imports relativos em arquivos TypeScript DEVEM carregar a extensão `.js` (ex: `import { prisma } from '../lib/prisma.js'`).
3. **Validação de Compilação e Lint:**
   - Ao término da task, executar:
     ```powershell
     npx.cmd tsc --noEmit
     npm.cmd run lint
     npm.cmd run format
     ```
     Nenhum erro de TypeScript ou ESLint pode permanecer.
4. **Documentação Viva no Swagger:**
   - Toda rota adicionada ao `src/routes.ts` deve conter tags descritivas, resumo (`summary`), descrição detalhada e schemas Zod para validação automática de entrada e saída no Swagger UI (`/docs`).

---

## 📑 Índice das Tarefas

| Arquivo                                                                            | Módulo   | Descrição Resumida                                              |
| :--------------------------------------------------------------------------------- | :------- | :-------------------------------------------------------------- |
| [`task-01-wallet-repository-ledger.md`](./task-01-wallet-repository-ledger.md)     | Módulo 4 | Contrato e implementação do repositório da carteira digital     |
| [`task-02-wallet-deposit.md`](./task-02-wallet-deposit.md)                         | Módulo 4 | Endpoint de depósito com transação ACID e registro contábil     |
| [`task-03-wallet-balance-statement.md`](./task-03-wallet-balance-statement.md)     | Módulo 4 | Endpoints de consulta de saldos e extrato completo              |
| [`task-04-art-institute-client.md`](./task-04-art-institute-client.md)             | Módulo 5 | Client HTTP com AbortController de 3.5s e construtor IIIF       |
| [`task-05-art-cache-catalog.md`](./task-05-art-cache-catalog.md)                   | Módulo 5 | Cache offline em PostgreSQL e busca de obras de domínio público |
| [`task-06-lots-creation-listing.md`](./task-06-lots-creation-listing.md)           | Módulo 6 | Criação de lotes por Leiloeiro e vitrine pública filtrada       |
| [`task-07-bidding-engine-concurrency.md`](./task-07-bidding-engine-concurrency.md) | Módulo 6 | Motor de lances com lock pessimista e travas de saldo           |
| [`task-08-anti-sniping-mechanism.md`](./task-08-anti-sniping-mechanism.md)         | Módulo 6 | Extensão dinâmica de 2 minutos para lances nos minutos finais   |
| [`task-09-cryptographic-hash-chain.md`](./task-09-cryptographic-hash-chain.md)     | Módulo 7 | Encadeamento HMAC-SHA256 (`prevHash -> bidHash`) e Selo Raiz    |
| [`task-10-public-audit-verifier.md`](./task-10-public-audit-verifier.md)           | Módulo 7 | Verificador público sem login detectando adulteração do banco   |
| [`task-11-lot-settlement-idempotent.md`](./task-11-lot-settlement-idempotent.md)   | Módulo 8 | Encerramento idempotente e liquidação financeira do arremate    |
| [`task-12-official-receipt-shareable.md`](./task-12-official-receipt-shareable.md) | Módulo 8 | Emissão e consulta pública do Comprovante Oficial com selo      |
| [`task-13-realtime-sse-live-auction.md`](./task-13-realtime-sse-live-auction.md)   | Módulo 8 | Streaming Server-Sent Events (SSE) da sala de pregão ao vivo    |
