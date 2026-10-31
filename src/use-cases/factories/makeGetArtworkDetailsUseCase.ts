import { PrismaExternalItemsCacheRepository } from '../../repositories/prisma/prismaExternalItemsCacheRepository.js'
import { GetArtworkDetailsUseCase } from '../getArtworkDetails.js'

export function makeGetArtworkDetailsUseCase() {
  const externalItemsCacheRepository =
    new PrismaExternalItemsCacheRepository()
  const useCase = new GetArtworkDetailsUseCase(externalItemsCacheRepository)

  return useCase
}
