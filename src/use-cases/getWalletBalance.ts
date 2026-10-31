import type { UsersRepository } from '../repositories/usersRepositories.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface GetWalletBalanceRequest {
  userId: string
}

interface GetWalletBalanceResponse {
  balanceTotal: number
  balanceCommitted: number
  balanceAvailable: number
  formattedTotal: string
  formattedCommitted: string
  formattedAvailable: string
}

function formatCentsToBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

export class GetWalletBalanceUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new ResourceNotFoundError()
    }

    const balanceTotal = Number(user.balanceTotal)
    const balanceCommitted = Number(user.balanceCommitted)
    const balanceAvailable = Number(user.balanceTotal - user.balanceCommitted)

    return {
      balanceTotal,
      balanceCommitted,
      balanceAvailable,
      formattedTotal: formatCentsToBRL(balanceTotal),
      formattedCommitted: formatCentsToBRL(balanceCommitted),
      formattedAvailable: formatCentsToBRL(balanceAvailable),
    }
  }
}
