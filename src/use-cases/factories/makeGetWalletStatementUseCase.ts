import { PrismaWalletTransactionsRepository } from '../../repositories/prisma/prismaWalletTransactionsRepository.js'
import { GetWalletStatementUseCase } from '../getWalletStatement.js'

export function makeGetWalletStatementUseCase() {
  const walletTransactionsRepository =
    new PrismaWalletTransactionsRepository()
  const useCase = new GetWalletStatementUseCase(walletTransactionsRepository)

  return useCase
}
