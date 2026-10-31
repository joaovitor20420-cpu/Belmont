import type { Bid, Prisma } from '@prisma/client'

export interface BidsRepository {
  create(data: Prisma.BidUncheckedCreateInput): Promise<Bid>
  findLastBidByLotId(lotId: string): Promise<Bid | null>
  findManyByLotId(lotId: string): Promise<Bid[]>
}
