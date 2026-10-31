import type { Prisma, Receipt } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { ReceiptsRepository } from '../receiptsRepository.js'

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

  async findByCode(code: string): Promise<Receipt | null> {
    return prisma.receipt.findUnique({
      where: { code },
    })
  }
}
