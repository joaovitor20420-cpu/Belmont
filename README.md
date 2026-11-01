# 🏛️ Belmont Fine Art Auctions — Casa de Leilões Online

> **Teste Técnico: [ELITE DEV] Desenvolvedor(a) Júnior Full Stack — Verzel**  
> **Candidato:** João Vitor Souza de Vasconcelos  
> **Stack Principal:** Node.js • Fastify • TypeScript • Zod • PostgreSQL • Prisma ORM • React 19 (Next.js App Router) • Tailwind CSS • shadcn/ui

---

## 📌 Visão Geral do Projeto

O **Belmont Fine Art Auctions** é uma plataforma completa de leilões online em tempo real para obras de arte homologadas de museus internacionais, projetada com foco em **consistência transacional (ACID)**, **concorrência pessimista (`SELECT ... FOR UPDATE`)**, **custódia fiduciária dinâmica (*Escrow*)**, **prorrogação automática *Anti-Sniping*** e **trilha pública de auditoria criptográfica à prova de adulteração (`HMAC-SHA256`)**.

---

## 🚀 Como Rodar o Projeto Localmente (Passo a Passo)

### Pré-requisitos
- **Node.js** `v20+` (recomendado `v22` ou `v24 LTS`)
- **Docker** e **Docker Compose** (para subir o banco PostgreSQL isolado na porta `5435`)

### 1. Clonar e instalar dependências
```bash
# Instalar dependências do Back-End (raiz)
npm install

# Instalar dependências do Front-End (pasta web/)
npm --prefix web install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` na raiz do projeto:
```bash
cp .env.example .env
```
Conteúdo padrão do `.env`:
```env
NODE_ENV=development
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/belmont_db?schema=public"
JWT_SECRET="belmont-super-secret-key-jwt-tokens-2026-very-secure"
```

### 3. Subir o banco de dados PostgreSQL via Docker
```bash
docker compose up -d
```

### 4. Executar as Migrations e o Seed Obrigatório
```bash
# Aplicar as migrations do Prisma no PostgreSQL
npx prisma migrate deploy

# Popular o banco com as Seeds Obrigatórias (1 Leiloeiro, 2 Clientes e 1 Lote Ao Vivo com lances abertos)
npm run seed
```

### 5. Iniciar a aplicação (Back-End + Front-End simultaneamente)
```bash
npm run dev
```
- **Front-End (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Back-End API (Fastify):** [http://localhost:3333](http://localhost:3333)
- **Documentação Swagger / OpenAPI:** [http://localhost:3333/docs](http://localhost:3333/docs)

---

## 🧪 Contas Semeadas Obrigatórias (Dados de Teste)

Conforme exigido no documento do desafio (**Página 05 — Dados de Teste**), o comando `npm run seed` deixa semeados **1 leiloeiro oficial**, **2 clientes licitantes** e **1 lote publicado ao vivo com lances abertos**, permitindo percorrer todo o fluxo imediatamente (inclusive com **botões de login rápido em 1 clique** no modal *"Entrar / Cadastrar"* da barra de navegação):

| Papel | Código Público | Nome | E-mail | Senha | Carteira Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Leiloeiro Oficial** | `LEI-0001` | Leiloeiro Oficial Belmont | `auctioneer@belmont.com` | `password123` | `R$ 0,00` |
| **Cliente Licitante 1** | `LIC-0001` | Helena Vasconcelos (`H*** V***`) | `bidder1@belmont.com` | `password123` | `R$ 250.000,00` (Livre após ser superada) |
| **Cliente Licitante 2** | `LIC-0002` | Eduardo Albuquerque (`E*** A***`) | `bidder2@belmont.com` | `password123` | `R$ 250.000,00` (`R$ 55.000,00` em *Escrow* como líder atual) |

- **Lote Ao Vivo Semeado (`LIVE`):** *"The Stroller (A Passeata - Coleção CMA)"* — Pierre-Auguste Renoir (`#151904`), com 2 lances abertos reais (`R$ 50.000,00` por `LIC-0001` e `R$ 55.000,00` por `LIC-0002`) e cadeia criptográfica `HMAC-SHA256` íntegra.

---

## 🌐 API Pública Externa Utilizada & Arquitetura de Resiliência

### Qual API pública foi escolhida?
O sistema integra duas APIs públicas reais e abertas de acervos museológicos internacionais (sem necessidade de chave privada):
1. **The Cleveland Museum of Art Open Access API** (`https://openaccess-api.clevelandart.org/api/artworks/`)
2. **Art Institute of Chicago API & IIIF Image Server** (`https://api.artic.edu/api/v1/artworks/search`)

### Como o consumo foi organizado para garantir resiliência?
Implementado em [`src/services/artInstituteApi.ts`](./src/services/artInstituteApi.ts) e [`src/use-cases/searchExternalArtworks.ts`](./src/use-cases/searchExternalArtworks.ts):
1. **Timeout Estrito (`AbortController` de 3.5s):** Evita que lentidões externas travem o painel do leiloeiro.
2. **Cache Persistente em Banco (`ExternalItemCache`):** Cada busca bem-sucedida é persistida no PostgreSQL (`prisma.externalItemCache`).
3. **Contingência Automática Offline (Fallback Curado):** Se as APIs externas sofrerem queda, bloqueio de rede ou *rate-limit*, o sistema retorna automaticamente o cache persistido no PostgreSQL ou o catálogo curado de obras em domínio público com imagens locais (`/arles.png`, `/cliff_walk.png`, `/stroller.png`, `/red_kerchief.png`), sinalizando a origem (`API_ONLINE`, `DATABASE_CACHE` ou `OFFLINE_FALLBACK`).
4. **Snapshot Imutável no Lote (`Lot`):** No momento em que o leiloeiro publica ou agenda um lote (`POST /lots`), os metadados da obra (`title`, `artist`, `description`, `imageUrl`, `externalApiId`) são copiados de forma independente para a tabela `lots`. Assim, a Vitrine, a Sala de Pregão, a Auditoria Pública e os Certificados possuem **zero dependência de disponibilidade futura da API externa**.

---

## 🔐 Técnica de Auditoria Criptográfica (Histórico à Prova de Adulteração)

Para atender ao requisito:
> *"O histórico de lances de cada lote deve ser verificável contra adulterações. Qualquer alteração, remoção ou inserção posterior no histórico (mesmo direto no banco de dados) deve ser detectada pela auditoria."*

### Como funciona a Hash Chain (`HMAC-SHA256`) + Selo Raiz do Lote (`lotSealHash`)
Implementada em [`src/utils/cryptoAudit.ts`](./src/utils/cryptoAudit.ts) e verificada em [`src/use-cases/verifyLotAuditTrail.ts`](./src/use-cases/verifyLotAuditTrail.ts):

1. **Encadeamento Sequencial Estrito (`sequenceNumber: 1..N`):**
   - O lance `#1` parte do hash gênesis (`prevHash = "0000...0000"`, 64 zeros).
   - Cada lance subsequente $i$ recebe como `prevHash` exatamente o `bidHash` do lance $i - 1$.
2. **Assinatura Canônica de Cada Lance (`bidHash`):**
   $$\text{payload}_i = \text{lotId} \mid \text{sequenceNumber}_i \mid \text{bidderId}_i \mid \text{amountInCents}_i \mid \text{timestampISO}_i \mid \text{prevHash}_i$$
   $$\text{bidHash}_i = \text{HMAC-SHA256}(\text{JWT\_SECRET}, \text{payload}_i)$$
3. **Selo Raiz de Fechamento (`lotSealHash`):**
   - Quando o lote é encerrado e liquidado, o servidor grava o `lotSealHash` assinando `lotId | winnerId | finalPrice | totalBids | lastBidHash`.

### O que a Auditoria Pública (`/audit` e `/audit/[lotId]`) detecta?
- **Adulteração de Valor, Autor ou Horário (`UPDATE` direto no SQL):** O `bidHash` recalculado diverge do `bidHash` armazenado no lance adulterado, acusando imediatamente `TAMPERED_OR_CORRUPTED` e apontando o `sequenceNumber` exato corrompido.
- **Deleção de Lance Intermediário (`DELETE` no SQL):** Quebra a continuidade `1, 2, ..., N` de `sequenceNumber` e invalida o `prevHash` do elo seguinte.
- **Inserção Clandestina (`INSERT` no SQL):** Sem a chave criptográfica do servidor e sem recomputar todos os elos subsequentes e o `lotSealHash`, a assinatura falha imediatamente.

> **Simulador Interativo de Adulteração:** Na página pública `/audit/[lotId]`, qualquer avaliador pode clicar no botão **"Simular Fraude SQL (+R$ 5.000)"** (que executa um `UPDATE` direto no banco sem atualizar os hashes) para ver o verificador público detectar o elo corrompido em tempo real, e depois clicar em **"Restaurar Original"**.

---

## ⚙️ Regras de Negócio, Concorrência & Privacidade (LGPD)

1. **Concorrência Pessimista (`SELECT ... FOR UPDATE`):**
   - Em [`src/use-cases/createBid.ts`](./src/use-cases/createBid.ts), a transação adquire lock pessimista na linha do lote (`SELECT * FROM lots WHERE id = $1 FOR UPDATE`) e nas carteiras dos usuários antes de validar o lance, impedindo condições de corrida (*race conditions*).
2. **Custódia Dinâmica (*Escrow*):**
   - $\text{Saldo Disponível} = \text{balanceTotal} - \text{balanceCommitted}$.
   - Quando um licitante assume a liderança, o valor do seu lance fica bloqueado em `balanceCommitted` (`BID_LOCK`).
   - No exato instante em que outro licitante o supera, o `balanceCommitted` do líder anterior é liberado (`BID_RELEASE`) na mesma transação ACID.
3. **Prorrogação Automática *Anti-Sniping* (+2 Minutos):**
   - Qualquer lance válido registrado nos **últimos 2 minutos** (`remainingMs <= 120_000`) estende automaticamente o `endTime` do lote em **+2 minutos**, notificando todos os participantes conectados via **SSE (`/lots/:id/stream`)**.
4. **Mensagens Claras de Recusa de Lance:**
   - Leiloeiro tentando dar lance: *"O leiloeiro não pode dar lances em lotes."* (`403`)
   - Líder cobrindo o próprio lance: *"Você já está ganhando este lote."* (`400`)
   - Valor abaixo do mínimo: *"Lance abaixo do mínimo permitido (R$ X)."* (`400`)
   - Saldo disponível insuficiente: *"Saldo disponível insuficiente para cobrir este lance."* (`400`)
   - Lote agendado ou já encerrado: *"Este lote ainda não iniciou / já foi encerrado."* (`400`)
5. **Privacidade e LGPD:**
   - Endpoints públicos jamais expõem e-mail, documento, senha ou nome completo dos licitantes. Todos os participantes são exibidos por seu código pseudonimizado (`LIC-0001`) e máscara LGPD (`H*** V***`).
6. **Certificado de Propriedade Exclusivo do Vencedor vs. Auditoria Pública:**
   - A **Auditoria Criptográfica (`/audit` e `/audit/[lotId]`)** é 100% pública e acessível sem login.
   - O **Certificado Oficial de Arrematação** é restrito exclusivamente ao licitante vencedor (`winnerId`) do lote encerrado, além do link público de verificação por código (`REC-YYYY-XXXXXX` em `/receipts/[code]`).

---

## 🧪 Executando a Suíte de Testes Automatizados

O projeto conta com uma bateria de **16 testes automatizados de integração e regras de negócio** em [`scripts/test-business-rules.ts`](./scripts/test-business-rules.ts), cobrindo todas as recusas de lance, troca atômica de saldo comprometido, *anti-sniping*, concorrência simultânea (`Promise.allSettled` com lock `FOR UPDATE`), auditoria criptográfica, detecção de adulteração de 1 centavo no SQL e idempotência da liquidação:

```bash
npm test
```

---

## ☁️ Guia de Deploy em Produção (Vercel + PostgreSQL Serverless)

1. **Banco de Dados (Neon / Supabase / Railway PostgreSQL):**
   - Crie uma instância PostgreSQL e configure `DATABASE_URL` com a string de conexão.
   - Execute `npx prisma migrate deploy && npm run seed`.
2. **Back-End Fastify (Render / Railway / Fly.io):**
   - Configure as variáveis `DATABASE_URL`, `JWT_SECRET`, `PORT=3333` e `NODE_ENV=production`.
   - Comando de inicialização: `npm start`.
3. **Front-End Next.js (Vercel):**
   - Defina o Root Directory como `web`.
   - Configure a variável de ambiente `NEXT_PUBLIC_API_URL` apontando para a URL pública do Back-End Fastify.
   - Comando de build: `npm run build`.
