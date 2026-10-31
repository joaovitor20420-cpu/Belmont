import {
  artInstituteClient,
  type ArtInstituteItem,
} from '../lib/artInstituteClient.js'
import type { ExternalItemsCacheRepository } from '../repositories/externalItemsCacheRepository.js'

interface SearchArtworksRequest {
  query?: string
  page?: number
  limit?: number
}

interface SearchArtworksResponse {
  source: 'api' | 'cache_fallback'
  items: ArtInstituteItem[]
}

export class SearchArtworksUseCase {
  constructor(
    private externalItemsCacheRepository: ExternalItemsCacheRepository,
  ) {}

  async execute({
    query = '',
    page = 1,
    limit = 15,
  }: SearchArtworksRequest): Promise<SearchArtworksResponse> {
    try {
      const artworks = await artInstituteClient.searchPublicArtworks({
        query,
        page,
        limit,
      })

      // Salva ou atualiza os itens buscados no cache local do PostgreSQL
      await Promise.allSettled(
        artworks.map((item) => this.externalItemsCacheRepository.save(item)),
      )

      return {
        source: 'api',
        items: artworks,
      }
    } catch {
      // Em caso de timeout (3.5s) ou falha de conectividade, recorre ao cache local
      const cachedItems =
        await this.externalItemsCacheRepository.findManyByQuery(query)

      const items: ArtInstituteItem[] = cachedItems.map((cached) => ({
        id: cached.id,
        title: cached.title,
        artistTitle: cached.artist,
        dateDisplay: cached.dateDisplay,
        mediumDisplay: cached.medium,
        dimensions: cached.dimensions,
        imageId: cached.imageId,
        imageUrl: artInstituteClient.buildIiifImageUrl(cached.imageId),
        isPublicDomain: true,
      }))

      return {
        source: 'cache_fallback',
        items,
      }
    }
  }
}
