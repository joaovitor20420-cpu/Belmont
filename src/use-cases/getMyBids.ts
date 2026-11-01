import { prisma } from '../lib/prisma.js'

export interface UserBidItemDTO {
  lotId: string
  title: string
  imageUrl: string
  artist: string | null
  currentPrice: number
  myHighestBid: number
  status: string
  endTime: Date
  isLeading: boolean
  hasWon: boolean
  receiptCode?: string | null
}

export interface GetMyBidsResponse {
  activeParticipations: UserBidItemDTO[]
  wonLots: UserBidItemDTO[]
  historicalParticipations: UserBidItemDTO[]
}

export class GetMyBidsUseCase {
  async execute(userId: string): Promise<GetMyBidsResponse> {
    // 1. Busca todos os lances realizados pelo usuário
    const userBids = await prisma.bid.findMany({
      where: { bidderId: userId },
      orderBy: { timestamp: 'desc' },
      include: {
        lot: {
          include: {
            receipt: true,
          },
        },
      },
    })

    // 2. Agrupa por lote para calcular a maior oferta do usuário em cada lote
    const lotMap = new Map<
      string,
      {
        lot: (typeof userBids)[0]['lot']
        myHighestBid: bigint
      }
    >()

    for (const b of userBids) {
      const existing = lotMap.get(b.lotId)
      if (!existing) {
        lotMap.set(b.lotId, {
          lot: b.lot,
          myHighestBid: b.amount,
        })
      } else if (b.amount > existing.myHighestBid) {
        existing.myHighestBid = b.amount
      }
    }

    const activeParticipations: UserBidItemDTO[] = []
    const wonLots: UserBidItemDTO[] = []
    const historicalParticipations: UserBidItemDTO[] = []

    for (const [lotId, data] of lotMap.entries()) {
      const { lot, myHighestBid } = data
      const isLeading = lot.currentWinnerId === userId
      const hasWon = lot.status === 'ENDED' && isLeading

      const dto: UserBidItemDTO = {
        lotId,
        title: lot.title,
        imageUrl: lot.imageUrl,
        artist: lot.artist,
        currentPrice: Number(lot.currentPrice),
        myHighestBid: Number(myHighestBid),
        status: lot.status,
        endTime: lot.endTime,
        isLeading,
        hasWon,
        receiptCode: lot.receipt?.code || null,
      }

      if (hasWon) {
        wonLots.push(dto)
      } else if (lot.status === 'LIVE' || lot.status === 'SCHEDULED') {
        activeParticipations.push(dto)
      } else {
        historicalParticipations.push(dto)
      }
    }

    return {
      activeParticipations,
      wonLots,
      historicalParticipations,
    }
  }
}
