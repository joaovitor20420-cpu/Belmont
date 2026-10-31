import { PrismaReceiptsRepository } from '../../repositories/prisma/prismaReceiptsRepository.js'
import { GetReceiptByCodeUseCase } from '../getReceiptByCode.js'

export function makeGetReceiptByCodeUseCase() {
  const receiptsRepository = new PrismaReceiptsRepository()
  const useCase = new GetReceiptByCodeUseCase(receiptsRepository)

  return useCase
}
