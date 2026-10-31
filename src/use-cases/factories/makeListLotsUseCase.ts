import { PrismaLotsRepository } from '../../repositories/prisma/prismaLotsRepository.js'
import { ListLotsUseCase } from '../listLots.js'

export function makeListLotsUseCase() {
  const lotsRepository = new PrismaLotsRepository()
  const useCase = new ListLotsUseCase(lotsRepository)

  return useCase
}
