import type { Lot } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'
import { LotCancellationError } from './errors/lot-cancellation-error.js'
import { auctionEvents } from '../lib/auctionEvents.js'

interface CancelLotRequest {
  lotId: string
  userId: string
  userRole?: string
}

interface CancelLotResponse {
  lot: {
    id: string
    title: string
    status: string
    bidsCount: number
  }
  cancelled: boolean
}

export class CancelLotUseCase {
  async execute({
    lotId,
    userId,
    userRole,
  }: CancelLotRequest): Promise<CancelLotResponse> {
    if (userRole && userRole !== 'AUCTIONEER') {
      throw new Error('Apenas o Leiloeiro Oficial tem permissão para cancelar lotes.')
    }

    const result = await prisma.$transaction(async (tx) => {
      const lotRaw = await tx.$queryRaw<Lot[]>`
        SELECT * FROM lots WHERE id = ${lotId} FOR UPDATE
      `
      const lot = lotRaw[0]

      if (!lot) {
        throw new ResourceNotFoundError()
      }

      // Idempotência se já cancelado
      if (lot.status === 'CANCELLED') {
        return {
          lot: {
            id: lot.id,
            title: lot.title,
            status: lot.status,
            bidsCount: lot.bidsCount,
          },
          cancelled: true,
        }
      }

      if (lot.status === 'ENDED') {
        throw new Error('Não é permitido cancelar um lote que já foi encerrado.')
      }

      // Regra de Negócio Central: cancelamento apenas permitido se ainda NÃO recebeu lances
      if (lot.bidsCount > 0) {
        throw new LotCancellationError(
          'Não é permitido cancelar um lote que já possui lances registrados no pregão.',
        )
      }

      const updated = await tx.lot.update({
        where: { id: lot.id },
        data: {
          status: 'CANCELLED',
        },
      })

      return {
        lot: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
          bidsCount: updated.bidsCount,
        },
        cancelled: true,
      }
    })

    // Notifica em tempo real a rede SSE
    auctionEvents.emit('update', {
      type: 'LOT_CANCELLED',
      lotId: result.lot.id,
      title: result.lot.title,
    })

    return result
  }
}
