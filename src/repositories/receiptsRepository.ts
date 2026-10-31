import type { Lot, Prisma, Receipt, User } from '@prisma/client'

export interface ReceiptWithDetails extends Receipt {
  lot: Lot
  winner: Pick<User, 'id' | 'publicCode' | 'maskedName'>
}

export interface ReceiptsRepository {
  create(data: Prisma.ReceiptUncheckedCreateInput): Promise<Receipt>
  findByLotId(lotId: string): Promise<Receipt | null>
  findByCode(code: string): Promise<ReceiptWithDetails | null>
}
