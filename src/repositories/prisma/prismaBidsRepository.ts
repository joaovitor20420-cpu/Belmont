import type { Bid, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { BidsRepository } from '../bidsRepository.js'

export class PrismaBidsRepository implements BidsRepository {
  async create(data: Prisma.BidUncheckedCreateInput): Promise<Bid> {
    return prisma.bid.create({
      data,
    })
  }

  async findLastBidByLotId(lotId: string): Promise<Bid | null> {
    return prisma.bid.findFirst({
      where: { lotId },
      orderBy: { sequenceNumber: 'desc' },
    })
  }

  async findManyByLotId(lotId: string): Promise<Bid[]> {
    return prisma.bid.findMany({
      where: { lotId },
      orderBy: { sequenceNumber: 'desc' },
    })
  }
}
