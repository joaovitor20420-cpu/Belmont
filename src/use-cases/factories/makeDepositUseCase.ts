import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { DepositUseCase } from '../deposit.js'

export function makeDepositUseCase() {
  const usersRepository = new PrismaUsersRepository()
  const useCase = new DepositUseCase(usersRepository)

  return useCase
}
