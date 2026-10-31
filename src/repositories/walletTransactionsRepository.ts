import type { Prisma, WalletTransaction } from '@prisma/client'

export interface WalletTransactionsRepository {
  create(data: Prisma.WalletTransactionUncheckedCreateInput): Promise<WalletTransaction>
  findManyByUserId(userId: string): Promise<WalletTransaction[]>
}
