import { EventEmitter } from 'node:events'

class AuctionEventsEmitter extends EventEmitter {}

export const auctionEvents = new AuctionEventsEmitter()

// Tipos de Eventos transmitidos no SSE
export type AuctionEventPayload =
  | {
      type: 'NEW_BID'
      lotId: string
      currentPrice: number
      minNextBid: number
      bidsCount: number
      leaderPublicCode: string
      leaderMaskedName: string
      antiSnipingExtended: boolean
      newEndTime: string
    }
  | {
      type: 'LOT_SETTLED'
      lotId: string
      finalPrice: number
      winnerPublicCode: string
      winnerMaskedName: string
      receiptCode: string
    }
