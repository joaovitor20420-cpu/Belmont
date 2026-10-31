import type { Prisma, WalletTransaction } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { WalletTransactionsRepository } from '../walletTransactionsRepository.js'

export class PrismaWalletTransactionsRepository implements WalletTransactionsRepository {
  async create(
    data: Prisma.WalletTransactionUncheckedCreateInput,
  ): Promise<WalletTransaction> {
    return prisma.walletTransaction.create({
      data,
    })
  }

  async findManyByUserId(userId: string): Promise<WalletTransaction[]> {
    return prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
