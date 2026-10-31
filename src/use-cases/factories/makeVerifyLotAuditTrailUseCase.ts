import { PrismaBidsRepository } from '../../repositories/prisma/prismaBidsRepository.js'
import { PrismaLotsRepository } from '../../repositories/prisma/prismaLotsRepository.js'
import { VerifyLotAuditTrailUseCase } from '../verifyLotAuditTrail.js'

export function makeVerifyLotAuditTrailUseCase() {
  const lotsRepository = new PrismaLotsRepository()
  const bidsRepository = new PrismaBidsRepository()
  const useCase = new VerifyLotAuditTrailUseCase(lotsRepository, bidsRepository)

  return useCase
}
