import crypto from 'node:crypto'
import { env } from '../env.js'

export interface BidHashPayload {
  lotId: string
  sequenceNumber: number
  bidderId: string
  amount: bigint | number
  timestamp: Date | string
  prevHash: string
}

export function calculateBidHash(payload: BidHashPayload): string {
  const normalizedTimestamp =
    payload.timestamp instanceof Date
      ? payload.timestamp.toISOString()
      : new Date(payload.timestamp).toISOString()

  // Formato canônico determinístico
  const message = [
    payload.lotId,
    payload.sequenceNumber,
    payload.bidderId,
    payload.amount.toString(),
    normalizedTimestamp,
    payload.prevHash,
  ].join('|')

  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(message)
    .digest('hex')
}

export function calculateLotSealHash(params: {
  lotId: string
  winnerId: string | null
  finalPrice: bigint | number
  totalBids: number
  lastBidHash: string
}): string {
  const message = [
    params.lotId,
    params.winnerId || 'NO_WINNER',
    params.finalPrice.toString(),
    params.totalBids,
    params.lastBidHash,
  ].join('|')

  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(message)
    .digest('hex')
}
