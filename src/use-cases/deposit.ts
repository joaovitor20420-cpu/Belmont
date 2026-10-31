import { prisma } from '../lib/prisma.js'
import type { UsersRepository } from '../repositories/usersRepositories.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface DepositUseCaseRequest {
  userId: string
  amountInCents: number
}

interface DepositUseCaseResponse {
  balanceTotal: number
  balanceAvailable: number
}

export class DepositUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    amountInCents,
  }: DepositUseCaseRequest): Promise<DepositUseCaseResponse> {
    if (amountInCents <= 0) {
      throw new Error('O valor do depósito em centavos deve ser positivo.')
    }

    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new ResourceNotFoundError()
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUniqueOrThrow({
        where: { id: userId },
      })

      const newBalanceTotal = currentUser.balanceTotal + BigInt(amountInCents)

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          balanceTotal: newBalanceTotal,
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: BigInt(amountInCents),
          balanceAfter: newBalanceTotal,
          description: `Depósito simulado de R$ ${(amountInCents / 100).toFixed(2)}`,
        },
      })

      return updated
    })

    return {
      balanceTotal: Number(updatedUser.balanceTotal),
      balanceAvailable: Number(
        updatedUser.balanceTotal - updatedUser.balanceCommitted,
      ),
    }
  }
}
