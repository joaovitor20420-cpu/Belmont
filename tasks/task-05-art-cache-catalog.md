# Task 05: Cache Local PostgreSQL & Catálogo de Obras (`GET /artworks/search`, `GET /artworks/:id`)

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Se a API do Art Institute of Chicago ficar fora do ar ou lenta, a nossa Casa de Leilões **não pode quebrar**.
Para isso, temos a tabela `external_items_cache` no PostgreSQL.
Sempre que uma obra de arte for buscada ou visualizada:

1. Os dados são salvos/atualizados no cache local do PostgreSQL.
2. Se a chamada externa der timeout (`AbortError`) ou erro 500, o sistema automaticamente recorre ao cache local (_Offline First Fallback_).
3. Leiloeiros podem buscar obras disponíveis para criar novos lotes de leilão.

---

## 🛠️ Arquivos a Criar / Modificar

1. `src/repositories/externalItemsCacheRepository.ts` (Criar)
2. `src/repositories/prisma/prismaExternalItemsCacheRepository.ts` (Criar)
3. `src/use-cases/searchArtworks.ts` (Criar)
4. `src/use-cases/getArtworkDetails.ts` (Criar)
5. `src/use-cases/factories/makeSearchArtworksUseCase.ts` (Criar)
6. `src/use-cases/factories/makeGetArtworkDetailsUseCase.ts` (Criar)
7. `src/controllers/searchArtworks.ts` (Criar)
8. `src/controllers/getArtworkDetails.ts` (Criar)
9. `src/routes.ts` (Modificar — plugar as rotas no Swagger)

---

## 📐 Especificação Técnica

### 1. Repositório `ExternalItemsCacheRepository`

- Métodos:
  - `save(item: ArtInstituteItem): Promise<void>` (utilizando `prisma.externalItemCache.upsert`).
  - `findManyByQuery(query: string): Promise<ExternalItemCache[]>` (busca com `contains` no título ou artista).
  - `findById(id: string): Promise<ExternalItemCache | null>`.

### 2. `SearchArtworksUseCase`

- Tenta chamar `artInstituteClient.searchPublicArtworks({ query, page, limit })`.
- Para cada item retornado com sucesso, salva em background no cache `externalItemsCacheRepository.save(item)`.
- **Tratamento de Exceção (Fallback):**
  - Se capturar timeout ou erro de rede da API do museu:
    - Busca no `externalItemsCacheRepository.findManyByQuery(query)`.
    - Retorna os itens do cache com uma flag de aviso `{ source: 'cache_fallback', items }`.

### 3. Rotas & Swagger

- `GET /artworks/search?query=van+gogh&page=1`
- `GET /artworks/:id`
- Ambas públicas ou autenticadas, documentadas na tag `'Catálogo de Obras'` no Swagger.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita limpa: `npx.cmd tsc --noEmit`.
2. Lint limpo: `npm.cmd run lint`.
3. Teste no Swagger UI:
   - Acessar `http://localhost:3333/docs`.
   - Executar `GET /artworks/search?query=water` e ver a lista de pinturas com imagens IIIF retornando em JSON.
   - Conferir no banco de dados que a tabela `external_items_cache` foi populada automaticamente.
