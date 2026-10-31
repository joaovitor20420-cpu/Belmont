import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { GetWalletBalanceUseCase } from '../getWalletBalance.js'

export function makeGetWalletBalanceUseCase() {
  const usersRepository = new PrismaUsersRepository()
  const useCase = new GetWalletBalanceUseCase(usersRepository)

  return useCase
}
