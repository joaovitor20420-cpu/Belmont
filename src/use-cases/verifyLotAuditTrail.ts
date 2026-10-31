import type { LotsRepository } from '../repositories/lotsRepository.js'
import type { BidsRepository } from '../repositories/bidsRepository.js'
import { calculateBidHash, calculateLotSealHash } from '../utils/cryptoAudit.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface VerifyLotAuditTrailRequest {
  lotId: string
}

interface AuditSuccessResponse {
  lotId: string
  totalBidsChecked: number
  isValid: true
  chainStatus: 'VERIFIED_INTEGRAL'
  lotSealVerified: boolean | null
  verifiedAt: string
}

interface AuditTamperedResponse {
  lotId: string
  totalBidsChecked: number
  isValid: false
  chainStatus: 'TAMPERED_OR_CORRUPTED'
  tamperedBid: {
    sequenceNumber: number
    reason: string
  }
}

export type VerifyLotAuditTrailResponse =
  | AuditSuccessResponse
  | AuditTamperedResponse

export class VerifyLotAuditTrailUseCase {
  constructor(
    private lotsRepository: LotsRepository,
    private bidsRepository: BidsRepository,
  ) {}

  async execute({
    lotId,
  }: VerifyLotAuditTrailRequest): Promise<VerifyLotAuditTrailResponse> {
    const lot = await this.lotsRepository.findById(lotId)

    if (!lot) {
      throw new ResourceNotFoundError()
    }

    const rawBids = await this.bidsRepository.findManyByLotId(lotId)
    // Ordena os lances rigorosamente em ordem crescente de sequência
    const bids = [...rawBids].sort((a, b) => a.sequenceNumber - b.sequenceNumber)

    let expectedPrevHash = '0'.repeat(64)

    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i]
      const expectedSequence = i + 1

      // 1. Verificação de integridade sequencial
      if (bid.sequenceNumber !== expectedSequence) {
        return {
          lotId,
          totalBidsChecked: i,
          isValid: false,
          chainStatus: 'TAMPERED_OR_CORRUPTED',
          tamperedBid: {
            sequenceNumber: bid.sequenceNumber,
            reason: `Quebra de sequência detectada: esperado lance #${expectedSequence}, mas encontrado #${bid.sequenceNumber}. Possível deleção de lance intermediário!`,
          },
        }
      }

      // 2. Verificação de encadeamento criptográfico (elo com o anterior)
      if (bid.prevHash !== expectedPrevHash) {
        return {
          lotId,
          totalBidsChecked: i,
          isValid: false,
          chainStatus: 'TAMPERED_OR_CORRUPTED',
          tamperedBid: {
            sequenceNumber: bid.sequenceNumber,
            reason: `Quebra de elo: prevHash do lance #${bid.sequenceNumber} não coincide com o hash do lance anterior. Inserção ou reordenação arbitrária detectada!`,
          },
        }
      }

      // 3. Recalcula o HMAC canônico do lance atual
      const recalculatedBidHash = calculateBidHash({
        lotId: bid.lotId,
        sequenceNumber: bid.sequenceNumber,
        bidderId: bid.bidderId,
        amount: bid.amount,
        timestamp: bid.timestamp,
        prevHash: bid.prevHash,
      })

      // 4. Verificação de adulteração dos dados do lance
      if (bid.bidHash !== recalculatedBidHash) {
        return {
          lotId,
          totalBidsChecked: i,
          isValid: false,
          chainStatus: 'TAMPERED_OR_CORRUPTED',
          tamperedBid: {
            sequenceNumber: bid.sequenceNumber,
            reason: `HMAC mismatch no lance #${bid.sequenceNumber}: dados do lance (valor, autor ou data) foram adulterados externamente no banco de dados!`,
          },
        }
      }

      expectedPrevHash = bid.bidHash
    }

    // 5. Se o lote estiver encerrado e com selo raiz, valida a integridade do selo
    let lotSealVerified: boolean | null = null

    if (lot.status === 'ENDED' && lot.lotSealHash) {
      const recalculatedSeal = calculateLotSealHash({
        lotId: lot.id,
        winnerId: lot.currentWinnerId,
        finalPrice: lot.currentPrice,
        totalBids: lot.bidsCount,
        lastBidHash: expectedPrevHash,
      })

      lotSealVerified = recalculatedSeal === lot.lotSealHash

      if (!lotSealVerified) {
        return {
          lotId,
          totalBidsChecked: bids.length,
          isValid: false,
          chainStatus: 'TAMPERED_OR_CORRUPTED',
          tamperedBid: {
            sequenceNumber: lot.bidsCount,
            reason:
              'O selo raiz do lote (lotSealHash) foi violado ou não coincide com o estado final do leilão!',
          },
        }
      }
    }

    return {
      lotId,
      totalBidsChecked: bids.length,
      isValid: true,
      chainStatus: 'VERIFIED_INTEGRAL',
      lotSealVerified,
      verifiedAt: new Date().toISOString(),
    }
  }
}
