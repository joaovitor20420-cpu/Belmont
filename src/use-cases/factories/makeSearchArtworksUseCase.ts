import { PrismaExternalItemsCacheRepository } from '../../repositories/prisma/prismaExternalItemsCacheRepository.js'
import { SearchArtworksUseCase } from '../searchArtworks.js'

export function makeSearchArtworksUseCase() {
  const externalItemsCacheRepository =
    new PrismaExternalItemsCacheRepository()
  const useCase = new SearchArtworksUseCase(externalItemsCacheRepository)

  return useCase
}
