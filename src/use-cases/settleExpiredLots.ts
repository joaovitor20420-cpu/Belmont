import { prisma } from '../lib/prisma.js'
import { makeSettleLotUseCase } from './factories/makeSettleLotUseCase.js'

export interface SettleExpiredLotsResponse {
  settledCount: number
  settledLots: Array<{
    lotId: string
    title: string
    receiptCode?: string | null
  }>
}

export class SettleExpiredLotsUseCase {
  async execute(): Promise<SettleExpiredLotsResponse> {
    const now = new Date()

    const expiredLots = await prisma.lot.findMany({
      where: {
        status: 'LIVE',
        endTime: { lte: now },
      },
      select: {
        id: true,
        title: true,
      },
    })

    if (expiredLots.length === 0) {
      return {
        settledCount: 0,
        settledLots: [],
      }
    }

    const settleLotUseCase = makeSettleLotUseCase()
    const settledLots: Array<{
      lotId: string
      title: string
      receiptCode?: string | null
    }> = []

    for (const lot of expiredLots) {
      try {
        const result = await settleLotUseCase.execute({ lotId: lot.id })
        settledLots.push({
          lotId: lot.id,
          title: lot.title,
          receiptCode: result.receipt?.code || null,
        })
      } catch (err) {
        console.error(`[AutoSettle] Erro ao liquidar lote expirado ${lot.id}:`, err)
      }
    }

    return {
      settledCount: settledLots.length,
      settledLots,
    }
  }
}
