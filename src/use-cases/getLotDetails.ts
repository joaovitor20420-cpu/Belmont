import type { LotsRepository } from '../repositories/lotsRepository.js'
import { formatLotToDTO, type LotDTO } from './createLot.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'
import { makeSettleLotUseCase } from './factories/makeSettleLotUseCase.js'
import { prisma } from '../lib/prisma.js'

export interface LotDetailsDTO extends LotDTO {
  bids: Array<{
    id: string
    amount: number
    bidHash: string
    prevHash: string
    sequenceNumber: number
    createdAt: Date
    bidder: {
      publicCode: string
      maskedName: string
    }
  }>
  receipt?: {
    publicCode: string
  } | null
}

interface GetLotDetailsRequest {
  id: string
}

interface GetLotDetailsResponse {
  lot: LotDetailsDTO
}

export class GetLotDetailsUseCase {
  constructor(private lotsRepository: LotsRepository) {}

  async execute({ id }: GetLotDetailsRequest): Promise<GetLotDetailsResponse> {
    let lot = await this.lotsRepository.findById(id)

    if (!lot) {
      throw new ResourceNotFoundError()
    }

    // Auto-liquidação se o lote venceu e ainda está marcado como LIVE
    if (lot.status === 'LIVE' && new Date() >= lot.endTime) {
      try {
        const settleLotUseCase = makeSettleLotUseCase()
        await settleLotUseCase.execute({ lotId: id })
        lot = await this.lotsRepository.findById(id)
      } catch {}
    }

    if (!lot) {
      throw new ResourceNotFoundError()
    }

    const [bids, receipt] = await Promise.all([
      prisma.bid.findMany({
        where: { lotId: id },
        orderBy: { sequenceNumber: 'desc' },
        include: {
          bidder: {
            select: {
              publicCode: true,
              maskedName: true,
            },
          },
        },
      }),
      prisma.receipt.findUnique({
        where: { lotId: id },
        select: {
          code: true,
        },
      }),
    ])

    return {
      lot: {
        ...formatLotToDTO(lot),
        bids: bids.map((b) => ({
          id: b.id,
          amount: Number(b.amount),
          bidHash: b.bidHash,
          prevHash: b.prevHash,
          sequenceNumber: b.sequenceNumber,
          createdAt: b.timestamp,
          bidder: {
            publicCode: b.bidder.publicCode,
            maskedName: b.bidder.maskedName,
          },
        })),
        receipt: receipt ? { publicCode: receipt.code } : null,
      },
    }
  }
}
