import type { ReceiptsRepository } from '../repositories/receiptsRepository.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface GetReceiptByCodeRequest {
  code: string
}

export interface OfficialReceiptDTO {
  code: string
  settledAt: Date
  finalAmountInCents: number
  finalAmountFormatted: string
  lotSealHash: string
  lot: {
    id: string
    title: string
    artist: string | null
    imageUrl: string
    totalBids: number
  }
  winner: {
    publicCode: string
    maskedName: string
  }
}

interface GetReceiptByCodeResponse {
  receipt: OfficialReceiptDTO
}

export class GetReceiptByCodeUseCase {
  constructor(private receiptsRepository: ReceiptsRepository) {}

  async execute({
    code,
  }: GetReceiptByCodeRequest): Promise<GetReceiptByCodeResponse> {
    const receipt = await this.receiptsRepository.findByCode(code)

    if (!receipt) {
      throw new ResourceNotFoundError()
    }

    const finalAmountInCents = Number(receipt.finalAmount)
    const finalAmountFormatted = `R$ ${(finalAmountInCents / 100).toFixed(2).replace('.', ',')}`

    return {
      receipt: {
        code: receipt.code,
        settledAt: receipt.settledAt,
        finalAmountInCents,
        finalAmountFormatted,
        lotSealHash: receipt.lotSealHash,
        lot: {
          id: receipt.lot.id,
          title: receipt.lot.title,
          artist: receipt.lot.artist,
          imageUrl: receipt.lot.imageUrl,
          totalBids: receipt.lot.bidsCount,
        },
        winner: {
          publicCode: receipt.winner.publicCode,
          maskedName: receipt.winner.maskedName,
        },
      },
    }
  }
}
