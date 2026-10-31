import type { Prisma, Receipt } from '@prisma/client'

export interface ReceiptsRepository {
  create(data: Prisma.ReceiptUncheckedCreateInput): Promise<Receipt>
  findByLotId(lotId: string): Promise<Receipt | null>
  findByCode(code: string): Promise<Receipt | null>
}
