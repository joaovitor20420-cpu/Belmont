import type { Lot, LoteStatus, Prisma } from '@prisma/client'

export interface LotWithWinner extends Lot {
  currentWinner?: {
    id: string
    maskedName: string
    publicCode: string
  } | null
}

export interface LotsRepository {
  create(data: Prisma.LotUncheckedCreateInput): Promise<Lot>
  findById(id: string): Promise<LotWithWinner | null>
  findExistingNonCancelledByItem(params: {
    externalApiId?: string | null
    title: string
  }): Promise<Lot | null>
  findMany(params: {
    status?: LoteStatus
    page?: number
    limit?: number
  }): Promise<LotWithWinner[]>
  update(id: string, data: Prisma.LotUpdateInput): Promise<Lot>
}
