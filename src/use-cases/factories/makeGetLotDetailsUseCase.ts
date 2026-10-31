import { PrismaLotsRepository } from '../../repositories/prisma/prismaLotsRepository.js'
import { GetLotDetailsUseCase } from '../getLotDetails.js'

export function makeGetLotDetailsUseCase() {
  const lotsRepository = new PrismaLotsRepository()
  const useCase = new GetLotDetailsUseCase(lotsRepository)

  return useCase
}
