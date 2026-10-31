import {
  artInstituteClient,
  type ArtInstituteItem,
} from '../lib/artInstituteClient.js'
import type { ExternalItemsCacheRepository } from '../repositories/externalItemsCacheRepository.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface GetArtworkDetailsRequest {
  id: string
}

interface GetArtworkDetailsResponse {
  artwork: ArtInstituteItem
  source: 'api' | 'cache_fallback'
}

export class GetArtworkDetailsUseCase {
  constructor(
    private externalItemsCacheRepository: ExternalItemsCacheRepository,
  ) {}

  async execute({
    id,
  }: GetArtworkDetailsRequest): Promise<GetArtworkDetailsResponse> {
    try {
      const artwork = await artInstituteClient.getArtworkById(id)

      if (artwork) {
        await this.externalItemsCacheRepository.save(artwork)

        return {
          artwork,
          source: 'api',
        }
      }
    } catch {
      // Fallback em caso de erro externo
    }

    // Busca no cache local como fallback
    const cached = await this.externalItemsCacheRepository.findById(id)

    if (!cached) {
      throw new ResourceNotFoundError()
    }

    const artwork: ArtInstituteItem = {
      id: cached.id,
      title: cached.title,
      artistTitle: cached.artist,
      dateDisplay: cached.dateDisplay,
      mediumDisplay: cached.medium,
      dimensions: cached.dimensions,
      imageId: cached.imageId,
      imageUrl: artInstituteClient.buildIiifImageUrl(cached.imageId),
      isPublicDomain: true,
    }

    return {
      artwork,
      source: 'cache_fallback',
    }
  }
}
