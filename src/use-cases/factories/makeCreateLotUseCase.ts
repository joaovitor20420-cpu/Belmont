import { PrismaLotsRepository } from '../../repositories/prisma/prismaLotsRepository.js'
import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { CreateLotUseCase } from '../createLot.js'

export function makeCreateLotUseCase() {
  const lotsRepository = new PrismaLotsRepository()
  const usersRepository = new PrismaUsersRepository()
  const useCase = new CreateLotUseCase(lotsRepository, usersRepository)

  return useCase
}
