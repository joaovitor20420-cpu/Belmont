import type { LoteStatus } from '@prisma/client'
import type { LotsRepository } from '../repositories/lotsRepository.js'
import { formatLotToDTO, type LotDTO } from './createLot.js'
import { makeSettleExpiredLotsUseCase } from './factories/makeSettleExpiredLotsUseCase.js'

interface ListLotsRequest {
  status?: LoteStatus
  page?: number
  limit?: number
}

interface ListLotsResponse {
  lots: LotDTO[]
}

export class ListLotsUseCase {
  constructor(private lotsRepository: LotsRepository) {}

  async execute({
    status,
    page = 1,
    limit = 20,
  }: ListLotsRequest): Promise<ListLotsResponse> {
    // Liquidação preguiçosa (lazy settlement) de lotes que já atingiram o prazo final
    try {
      const settleExpiredLotsUseCase = makeSettleExpiredLotsUseCase()
      await settleExpiredLotsUseCase.execute()
    } catch {}

    const rawLots = await this.lotsRepository.findMany({
      status,
      page,
      limit,
    })

    const lots = rawLots.map((lot) => formatLotToDTO(lot))

    return {
      lots,
    }
  }
}
