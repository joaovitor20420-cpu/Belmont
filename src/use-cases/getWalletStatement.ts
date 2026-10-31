import type { WalletTxType } from '@prisma/client'
import type { WalletTransactionsRepository } from '../repositories/walletTransactionsRepository.js'

interface GetWalletStatementRequest {
  userId: string
}

export interface StatementTransaction {
  id: string
  userId: string
  lotId: string | null
  type: WalletTxType
  amount: number
  balanceAfter: number
  description: string
  createdAt: Date
}

interface GetWalletStatementResponse {
  transactions: StatementTransaction[]
}

export class GetWalletStatementUseCase {
  constructor(
    private walletTransactionsRepository: WalletTransactionsRepository,
  ) {}

  async execute({
    userId,
  }: GetWalletStatementRequest): Promise<GetWalletStatementResponse> {
    const rawTransactions =
      await this.walletTransactionsRepository.findManyByUserId(userId)

    const transactions: StatementTransaction[] = rawTransactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      lotId: tx.lotId,
      type: tx.type,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balanceAfter),
      description: tx.description,
      createdAt: tx.createdAt,
    }))

    return { transactions }
  }
}
