import type { Lot, LoteStatus, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { LotsRepository, LotWithWinner } from '../lotsRepository.js'

export class PrismaLotsRepository implements LotsRepository {
  async create(data: Prisma.LotUncheckedCreateInput): Promise<Lot> {
    return prisma.lot.create({
      data,
    })
  }

  async findById(id: string): Promise<LotWithWinner | null> {
    return prisma.lot.findUnique({
      where: { id },
      include: {
        currentWinner: {
          select: {
            id: true,
            maskedName: true,
            publicCode: true,
          },
        },
      },
    })
  }

  async findExistingNonCancelledByItem({
    externalApiId,
    title,
  }: {
    externalApiId?: string | null
    title: string
  }): Promise<Lot | null> {
    const cleanExternalId = externalApiId?.trim() || null
    const cleanTitle = title.trim()

    const orConditions: Prisma.LotWhereInput[] = [
      {
        title: {
          equals: cleanTitle,
          mode: 'insensitive',
        },
      },
    ]

    if (cleanExternalId) {
      orConditions.unshift({
        externalApiId: cleanExternalId,
      })
    }

    return prisma.lot.findFirst({
      where: {
        status: {
          not: 'CANCELLED',
        },
        OR: orConditions,
      },
    })
  }

  async findMany({
    status,
    page = 1,
    limit = 20,
  }: {
    status?: LoteStatus
    page?: number
    limit?: number
  }): Promise<LotWithWinner[]> {
    return prisma.lot.findMany({
      where: status ? { status } : { status: { not: 'CANCELLED' } },
      include: {
        currentWinner: {
          select: {
            id: true,
            maskedName: true,
            publicCode: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  async update(id: string, data: Prisma.LotUpdateInput): Promise<Lot> {
    return prisma.lot.update({
      where: { id },
      data,
    })
  }
}
