import type { Lot, User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'
import { AuctionNotActiveError } from './errors/auction-not-active-error.js'
import { SelfOutbidError } from './errors/self-outbid-error.js'
import { InvalidBidAmountError } from './errors/invalid-bid-amount-error.js'
import { InsufficientFundsError } from './errors/insufficient-funds-error.js'
import { calculateBidHash } from '../utils/cryptoAudit.js'
import { auctionEvents } from '../lib/auctionEvents.js'

export interface BidDTO {
  id: string
  lotId: string
  bidderId: string
  amount: number
  sequenceNumber: number
  timestamp: Date
  prevHash: string
  bidHash: string
}

interface CreateBidRequest {
  lotId: string
  bidderId: string
  amountInCents: number
}

interface CreateBidResponse {
  bid: BidDTO
  lot: {
    id: string
    currentPrice: number
    bidsCount: number
    currentWinnerId: string | null
    endTime: Date
  }
  antiSniping: {
    extended: boolean
    newEndTime: Date
  }
}

export class CreateBidUseCase {
  async execute({
    lotId,
    bidderId,
    amountInCents,
  }: CreateBidRequest): Promise<CreateBidResponse> {
    if (amountInCents <= 0) {
      throw new InvalidBidAmountError(
        'O valor do lance deve ser maior que zero.',
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock pessimista no Lote (FOR UPDATE)
      const lotRaw = await tx.$queryRaw<Lot[]>`
        SELECT * FROM lots WHERE id = ${lotId} FOR UPDATE
      `
      const lot = lotRaw[0]

      if (!lot) {
        throw new ResourceNotFoundError()
      }

      // 2. Validações de status, horário e leiloeiro criador
      const now = new Date()
      if (lot.status !== 'LIVE' || now > lot.endTime) {
        throw new AuctionNotActiveError(
          'O leilão deste lote não está ativo no momento.',
        )
      }

      if (lot.userId && lot.userId === bidderId) {
        throw new Error(
          'O leiloeiro criador não tem permissão para dar lances no próprio lote.',
        )
      }

      // 3. Regra de Auto-Cobertura (Líder atual não pode cobrir o próprio lance)
      if (lot.currentWinnerId === bidderId) {
        throw new SelfOutbidError(
          'Você já é o líder atual deste lote. Aguarde outro licitante cobrir seu lance.',
        )
      }

      // 4. Regra de Incremento Mínimo
      const minAcceptableAmount =
        lot.bidsCount === 0
          ? lot.startPrice
          : lot.currentPrice + lot.minIncrement

      if (BigInt(amountInCents) < minAcceptableAmount) {
        throw new InvalidBidAmountError(
          `O lance mínimo aceitável é de R$ ${(Number(minAcceptableAmount) / 100).toFixed(2).replace('.', ',')}`,
        )
      }

      // 5. Lock pessimista no Licitante e checagem de saldo disponível
      const bidderRaw = await tx.$queryRaw<User[]>`
        SELECT * FROM users WHERE id = ${bidderId} FOR UPDATE
      `
      const bidder = bidderRaw[0]

      if (!bidder) {
        throw new ResourceNotFoundError()
      }

      const balanceAvailable = bidder.balanceTotal - bidder.balanceCommitted

      if (balanceAvailable < BigInt(amountInCents)) {
        throw new InsufficientFundsError(
          'Saldo disponível insuficiente na carteira para cobrir este lance.',
        )
      }

      // 6. Desbloqueio imediato do saldo do líder anterior (se houver)
      if (lot.currentWinnerId && lot.currentWinnerId !== bidder.id) {
        const previousLeader = await tx.user.findUnique({
          where: { id: lot.currentWinnerId },
        })

        if (previousLeader) {
          const releasedCommitted =
            previousLeader.balanceCommitted - lot.currentPrice

          await tx.user.update({
            where: { id: previousLeader.id },
            data: {
              balanceCommitted: releasedCommitted,
            },
          })

          await tx.walletTransaction.create({
            data: {
              userId: previousLeader.id,
              lotId: lot.id,
              type: 'BID_RELEASE',
              amount: lot.currentPrice,
              balanceAfter: previousLeader.balanceTotal - releasedCommitted,
              description: `Saldo liberado: lance superado no lote "${lot.title}"`,
            },
          })
        }
      }

      // 7. Bloqueio atômico do saldo do novo líder provisório
      const newCommitted = bidder.balanceCommitted + BigInt(amountInCents)

      await tx.user.update({
        where: { id: bidder.id },
        data: {
          balanceCommitted: newCommitted,
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId: bidder.id,
          lotId: lot.id,
          type: 'BID_LOCK',
          amount: BigInt(amountInCents),
          balanceAfter: bidder.balanceTotal - newCommitted,
          description: `Saldo bloqueado: liderança provisória no lote "${lot.title}"`,
        },
      })

      // 8. Registro do Lance com Trilha Criptográfica (Hash Chain HMAC-SHA256)
      const lastBid = await tx.bid.findFirst({
        where: { lotId: lot.id },
        orderBy: { sequenceNumber: 'desc' },
      })

      const prevHash = lastBid ? lastBid.bidHash : '0'.repeat(64)
      const nextSequence = lot.bidsCount + 1
      const bidTimestamp = new Date()

      const bidHash = calculateBidHash({
        lotId: lot.id,
        sequenceNumber: nextSequence,
        bidderId: bidder.id,
        amount: BigInt(amountInCents),
        timestamp: bidTimestamp,
        prevHash,
      })

      const bid = await tx.bid.create({
        data: {
          lotId: lot.id,
          bidderId: bidder.id,
          amount: BigInt(amountInCents),
          sequenceNumber: nextSequence,
          timestamp: bidTimestamp,
          prevHash,
          bidHash,
        },
      })

      // 9. Mecanismo de Anti-Sniping (+2 minutos nos 2 minutos finais)
      const twoMinutesInMs = 2 * 60 * 1000 // 120.000 ms
      const timeRemaining = lot.endTime.getTime() - now.getTime()

      let timeExtended = false
      let newEndTime = lot.endTime

      if (timeRemaining <= twoMinutesInMs && timeRemaining > 0) {
        timeExtended = true
        newEndTime = new Date(lot.endTime.getTime() + twoMinutesInMs)
      }

      // 10. Atualização dos valores do Lote (com prorrogação se acionado Anti-Sniping)
      const updatedLot = await tx.lot.update({
        where: { id: lot.id },
        data: {
          currentPrice: BigInt(amountInCents),
          currentWinnerId: bidder.id,
          bidsCount: nextSequence,
          endTime: newEndTime,
        },
      })

      return {
        bid: {
          id: bid.id,
          lotId: bid.lotId,
          bidderId: bid.bidderId,
          amount: Number(bid.amount),
          sequenceNumber: bid.sequenceNumber,
          timestamp: bid.timestamp,
          prevHash: bid.prevHash,
          bidHash: bid.bidHash,
        },
        lot: {
          id: updatedLot.id,
          currentPrice: Number(updatedLot.currentPrice),
          bidsCount: updatedLot.bidsCount,
          currentWinnerId: updatedLot.currentWinnerId,
          endTime: updatedLot.endTime,
        },
        antiSniping: {
          extended: timeExtended,
          newEndTime,
        },
        broadcast: {
          type: 'NEW_BID' as const,
          lotId: updatedLot.id,
          currentPrice: Number(updatedLot.currentPrice),
          minNextBid: Number(updatedLot.currentPrice + lot.minIncrement),
          bidsCount: updatedLot.bidsCount,
          leaderPublicCode: bidder.publicCode,
          leaderMaskedName: bidder.maskedName,
          antiSnipingExtended: timeExtended,
          newEndTime: newEndTime.toISOString(),
        },
      }
    })

    // Transmite a atualização instantânea para todas as salas SSE conectadas
    auctionEvents.emit('update', result.broadcast)

    return {
      bid: result.bid,
      lot: result.lot,
      antiSniping: result.antiSniping,
    }
  }
}
