# 📊 Progresso do Projeto — Casa de Leilões Online (Verzel Elite Dev)

> **Candidato:** João Vitor Souza de Vasconcelos  
> **Stack:** Node.js, Fastify, TypeScript, Zod, PostgreSQL, Prisma ORM, React (Next.js), Tailwind CSS  
> **API Externa de Catálogo:** Art Institute of Chicago API

---

## 🧭 Status Geral dos Módulos

- [x] **Módulo 1: Setup do Back-End & Ambiente Base**
  - [x] 1.1 Inicialização do `package.json`, TypeScript e dependências base.
  - [x] 1.2 Configuração de ES Modules (`type: module`), `tsconfig.json` com tipagem estrita e primeiro servidor Fastify (`GET /health`).
  - [x] 1.3 Validação Fail-Fast de variáveis de ambiente com Zod (`src/env.ts`).

- [x] **Módulo 2: Banco de Dados PostgreSQL & Prisma ORM**
  - [x] 2.1 Infraestrutura como código com Docker Compose (`docker-compose.yml`), container `belmont-db` (Postgres 15 na porta 5435) e proteção de segredos no `.gitignore`.
  - [x] 2.2 Instalação e inicialização do Prisma ORM (`prisma/schema.prisma`).
  - [x] 2.3 Modelagem da entidade `User` (Autenticação, papéis `AUCTIONEER` / `BIDDER`, mascaramento LGPD).
  - [x] 2.4 Modelagem das entidades `Lot`, `Bid`, `WalletTransaction` e `Receipt` (com valores em centavos via `BigInt`).
  - [x] 2.5 Criação e aplicação das migrations no PostgreSQL local.

- [x] **Módulo 3: Autenticação, Perfis & Autorização**
  - [x] 3.1 Hash seguro de senhas com `bcryptjs`, Singleton do Prisma e utilitários LGPD.
  - [x] 3.2 Emissão e validação de JWT em cookies seguros (`HttpOnly`, `SameSite`).
  - [x] 3.3 Middlewares Fastify para proteção de rotas e verificação de papéis (RBAC).
  - [x] 3.4 Pseudonimização automática para LGPD (`LIC-XXXX`, `LEI-XXXX`, `J*** V***`).

- [x] **Módulo 4: Carteira Digital & Saldo Comprometido**
  - [x] 4.1 Ledger de transações da carteira (`DEPOSIT`, `BID_LOCK`, `BID_RELEASE`, `SETTLEMENT`).
  - [x] 4.2 Endpoint de depósito simulado para licitantes.
  - [x] 4.3 Cálculo atômico de saldos: Total, Comprometido e Disponível.

- [x] **Módulo 5: Integração com a API do Art Institute of Chicago**
  - [x] 5.1 Client HTTP com timeout de 3.5s (`AbortController`) e tratamento de indisponibilidade.
  - [x] 5.2 Mapeamento de metadados, identificador IIIF de imagens e validação de domínio público.
  - [x] 5.3 Cache local em PostgreSQL (`ExternalItemCache`) para garantir funcionamento offline.

- [x] **Módulo 6: Motor de Lances & Anti-Sniping (Core do Desafio)**
  - [x] 6.1 Transações ACID interativas com lock pessimista (`SELECT ... FOR UPDATE`).
  - [x] 6.2 Regras de incremento mínimo e bloqueio de lances inválidos/auto-cobertura.
  - [x] 6.3 Liberação instantânea do saldo do líder superado e bloqueio do novo líder.
  - [x] 6.4 Mecanismo de Anti-Sniping (+2 minutos nos 2 minutos finais).

- [x] **Módulo 7: Trilha de Auditoria Criptográfica à Prova de Fraude**
  - [x] 7.1 Implementação da Hash Chain HMAC-SHA256 (`prevHash -> bidHash`).
  - [x] 7.2 Cálculo do Selo Raiz do Lote (`lotSealHash`).
  - [x] 7.3 Verificador público de integridade sem login (detectando adulterações, inserções e deleções no banco).

- [ ] **Módulo 8: Encerramento, Liquidação & Comprovantes Oficiais**
  - [x] 8.1 Rotina de liquidação financeira idempotente.
  - [x] 8.2 Emissão de Comprovante Oficial com código autenticado e link compartilhável.
  - [ ] 8.3 Streaming em tempo real (SSE) para atualização instantânea da sala de pregão.

- [ ] **Módulo 9: Front-End React (Next.js + Tailwind + shadcn/ui)**
  - [ ] 9.1 Vitrine de lotes com abas (Ao vivo, Agendados, Encerrados).
  - [ ] 9.2 Sala do lote ao vivo (lances rápidos, ranking, anti-sniping e SSE).
  - [ ] 9.3 Painel do Leiloeiro (busca na API de arte, criação e cancelamento de lotes).
  - [ ] 9.4 Carteira do Licitante e tela pública do Comprovante de Arremate.
  - [ ] 9.5 Verificador visual de auditoria criptográfica com simulador de adulteração.

- [ ] **Módulo 10: Testes Automatizados, Seeds Obrigatórias & Deploy**
  - [ ] 10.1 Suíte de testes unitários e de integração (concorrência, saldo e integridade).
  - [ ] 10.2 Seeds obrigatórias (1 leiloeiro, 2 licitantes e lote aberto para avaliação imediata).
  - [ ] 10.3 Deploy em produção (Vercel + Neon DB) e documentação final do README.
