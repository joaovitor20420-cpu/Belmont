import type { Prisma, Receipt } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type {
  ReceiptsRepository,
  ReceiptWithDetails,
} from '../receiptsRepository.js'

export class PrismaReceiptsRepository implements ReceiptsRepository {
  async create(data: Prisma.ReceiptUncheckedCreateInput): Promise<Receipt> {
    return prisma.receipt.create({
      data,
    })
  }

  async findByLotId(lotId: string): Promise<Receipt | null> {
    return prisma.receipt.findUnique({
      where: { lotId },
    })
  }

  async findByCode(code: string): Promise<ReceiptWithDetails | null> {
    return prisma.receipt.findUnique({
      where: { code },
      include: {
        lot: true,
        winner: {
          select: {
            id: true,
            publicCode: true,
            maskedName: true,
          },
        },
      },
    })
  }
}
