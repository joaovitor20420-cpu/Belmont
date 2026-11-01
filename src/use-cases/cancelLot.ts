import type { Lot } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'
import { LotCancellationError } from './errors/lot-cancellation-error.js'
import { auctionEvents } from '../lib/auctionEvents.js'

interface CancelLotRequest {
  lotId: string
  userId: string
  userRole?: string
  autoRefund?: boolean
}

interface CancelLotResponse {
  lot: {
    id: string
    title: string
    status: string
    bidsCount: number
  }
  cancelled: boolean
  refundedAmountInCents?: number
}

export class CancelLotUseCase {
  async execute({
    lotId,
    userId,
    userRole,
    autoRefund = false,
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
          refundedAmountInCents: 0,
        }
      }

      if (lot.status === 'ENDED') {
        throw new Error('Não é permitido cancelar um lote que já foi encerrado.')
      }

      let refundedAmountInCents = 0

      // Regra de Negócio Central + Opcional Verzel (Cancelamento com estorno automático)
      if (lot.bidsCount > 0) {
        if (!autoRefund) {
          throw new LotCancellationError(
            'Não é permitido cancelar um lote que já possui lances registrados no pregão.',
          )
        }

        // Estorno automático do saldo comprometido do líder atual
        if (lot.currentWinnerId && lot.currentPrice > BigInt(0)) {
          const updatedWinner = await tx.user.update({
            where: { id: lot.currentWinnerId },
            data: {
              balanceCommitted: {
                decrement: lot.currentPrice,
              },
            },
          })

          await tx.walletTransaction.create({
            data: {
              userId: lot.currentWinnerId,
              lotId: lot.id,
              type: 'BID_RELEASE',
              amount: lot.currentPrice,
              balanceAfter:
                updatedWinner.balanceTotal - updatedWinner.balanceCommitted,
              description: `Estorno automático por cancelamento do lote "${lot.title}"`,
            },
          })

          refundedAmountInCents = Number(lot.currentPrice)
        }
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
        refundedAmountInCents,
      }
    })

    // Notifica em tempo real a rede SSE
    auctionEvents.emit('update', {
      type: 'LOT_CANCELLED',
      lotId: result.lot.id,
      title: result.lot.title,
      refundedAmountInCents: result.refundedAmountInCents,
    })

    return result
  }
}
