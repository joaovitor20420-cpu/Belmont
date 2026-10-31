# Task 04: Client HTTP da API do Art Institute of Chicago com Resiliência

> ⚠️ **INSTRUÇÃO OBRIGATÓRIA PARA A IA EXECUTORA:**  
> **Leia o arquivo `architecture.md` e execute com perfeição a tarefa descrita abaixo.**  
> Respeite rigorosamente a Clean Architecture, SOLID, NodeNext ES Modules (extensão `.js` nos imports) e garanta compilação limpa no TypeScript (`npx tsc --noEmit`) e no ESLint (`npm run lint`).

## 📌 Contexto & Objetivo

Os leilões utilizam obras de arte reais provenientes da API pública do **Art Institute of Chicago** (`https://api.artic.edu/docs/`).
Por exigência de engenharia do edital da Verzel:

1. As chamadas à API externa devem ter um **timeout estrito de 3.5 segundos** via `AbortController`, evitando que o servidor Fastify fique preso se o museu estiver instável.
2. Deve validar se a obra está em **domínio público** (`is_public_domain: true`).
3. Deve construir a URL da imagem no padrão **IIIF** (`https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`).

O objetivo desta tarefa é construir a camada de integração HTTP externa com tratamento de falhas e fallback.

---

## 🛠️ Arquivos a Criar

1. `src/lib/artInstituteClient.ts`

---

## 📐 Especificação Técnica

### Arquivo `src/lib/artInstituteClient.ts`

#### Tipos TypeScript:

```typescript
export interface ArtInstituteItem {
  id: string
  title: string
  artistTitle: string | null
  dateDisplay: string | null
  mediumDisplay: string | null
  dimensions: string | null
  imageId: string | null
  imageUrl: string | null
  isPublicDomain: boolean
}

export interface SearchArtworksParams {
  query?: string
  page?: number
  limit?: number
}
```

#### Métodos da Classe/Módulo:

1. `buildIiifImageUrl(imageId: string | null): string | null`:
   - Se `imageId` for nulo, retornar imagem placeholder de fallback.
   - Retornar: `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`.

2. `searchPublicArtworks(params: SearchArtworksParams): Promise<ArtInstituteItem[]>`:
   - URL base: `https://api.artic.edu/api/v1/artworks/search`
   - Query params:
     - `q`: query de busca (ex: "Monet", "Van Gogh", "landscape")
     - `page`: default 1
     - `limit`: default 15
     - `fields`: `id,title,artist_title,date_display,medium_display,dimensions,image_id,is_public_domain`
   - Configurar `AbortController` com `setTimeout` de 3500ms (3.5 segundos).
   - Filtrar obras para garantir `is_public_domain === true`.
   - Mapear para o formato `ArtInstituteItem`.

3. `getArtworkById(id: string): Promise<ArtInstituteItem | null>`:
   - URL: `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,artist_title,date_display,medium_display,dimensions,image_id,is_public_domain`
   - Timeout de 3500ms.

---

## 📋 Critérios de Aceite & Validação

1. Compilação estrita: `npx.cmd tsc --noEmit`.
2. Lint: `npm.cmd run lint`.
3. Teste manual simples com script temporário em `src/index.ts` ou terminal chamando `artInstituteClient.searchPublicArtworks({ query: 'Monet' })` e verificando que obras como "Water Lilies" retornam com URLs de imagem válidas.
