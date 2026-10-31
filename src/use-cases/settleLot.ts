import crypto from 'node:crypto'
import type { Lot, User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { calculateLotSealHash } from '../utils/cryptoAudit.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface SettleLotRequest {
  lotId: string
}

export interface SettledReceiptDTO {
  id: string
  lotId: string
  winnerId: string
  code: string
  finalAmount: number
  lotSealHash: string
  settledAt: Date
}

export interface SettleLotResponse {
  alreadySettled: boolean
  lot: {
    id: string
    title: string
    status: string
    currentPrice: number
    bidsCount: number
    currentWinnerId: string | null
    lotSealHash: string | null
  }
  receipt: SettledReceiptDTO | null
}

export class SettleLotUseCase {
  async execute({ lotId }: SettleLotRequest): Promise<SettleLotResponse> {
    return prisma.$transaction(async (tx) => {
      // 1. Lock pessimista no Lote para garantir que nenhuma ação concorrente ocorra
      const lotRaw = await tx.$queryRaw<Lot[]>`
        SELECT * FROM lots WHERE id = ${lotId} FOR UPDATE
      `
      const lot = lotRaw[0]

      if (!lot) {
        throw new ResourceNotFoundError()
      }

      // 2. Checagem de Idempotência Estrita
      if (lot.status === 'ENDED') {
        const existingReceipt = await tx.receipt.findUnique({
          where: { lotId: lot.id },
        })

        return {
          alreadySettled: true,
          lot: {
            id: lot.id,
            title: lot.title,
            status: lot.status,
            currentPrice: Number(lot.currentPrice),
            bidsCount: lot.bidsCount,
            currentWinnerId: lot.currentWinnerId,
            lotSealHash: lot.lotSealHash,
          },
          receipt: existingReceipt
            ? {
                id: existingReceipt.id,
                lotId: existingReceipt.lotId,
                winnerId: existingReceipt.winnerId,
                code: existingReceipt.code,
                finalAmount: Number(existingReceipt.finalAmount),
                lotSealHash: existingReceipt.lotSealHash,
                settledAt: existingReceipt.settledAt,
              }
            : null,
        }
      }

      // 3. Caso o lote possua lances e um vencedor legítimo
      if (lot.currentWinnerId && lot.bidsCount > 0) {
        // Lock no usuário vencedor
        const winnerRaw = await tx.$queryRaw<User[]>`
          SELECT * FROM users WHERE id = ${lot.currentWinnerId} FOR UPDATE
        `
        const winner = winnerRaw[0]

        if (!winner) {
          throw new ResourceNotFoundError()
        }

        // Converte saldo temporariamente comprometido em débito definitivo
        const newTotal = winner.balanceTotal - lot.currentPrice
        const newCommitted = winner.balanceCommitted - lot.currentPrice

        await tx.user.update({
          where: { id: winner.id },
          data: {
            balanceTotal: newTotal,
            balanceCommitted: newCommitted,
          },
        })

        // Gera registro contábil definitivo de liquidação (SETTLEMENT_DEBIT)
        await tx.walletTransaction.create({
          data: {
            userId: winner.id,
            lotId: lot.id,
            type: 'SETTLEMENT_DEBIT',
            amount: lot.currentPrice,
            balanceAfter: newTotal - newCommitted,
            description: `Liquidação definitiva de arremate do lote "${lot.title}"`,
          },
        })

        // 4. Busca o último lance para cálculo do Selo Criptográfico Raiz (lotSealHash)
        const lastBid = await tx.bid.findFirst({
          where: { lotId: lot.id },
          orderBy: { sequenceNumber: 'desc' },
        })

        const lastBidHash = lastBid ? lastBid.bidHash : '0'.repeat(64)

        const lotSealHash = calculateLotSealHash({
          lotId: lot.id,
          winnerId: winner.id,
          finalPrice: lot.currentPrice,
          totalBids: lot.bidsCount,
          lastBidHash,
        })

        // 5. Atualiza o Lote para status ENDED selando a trilha criptográfica
        const updatedLot = await tx.lot.update({
          where: { id: lot.id },
          data: {
            status: 'ENDED',
            lotSealHash,
          },
        })

        // 6. Emite o Comprovante Oficial com código único autenticado
        const year = new Date().getFullYear()
        const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase()
        const receiptCode = `REC-${year}-${randomCode}`

        const receipt = await tx.receipt.create({
          data: {
            lotId: lot.id,
            winnerId: winner.id,
            code: receiptCode,
            finalAmount: lot.currentPrice,
            lotSealHash,
          },
        })

        return {
          alreadySettled: false,
          lot: {
            id: updatedLot.id,
            title: updatedLot.title,
            status: updatedLot.status,
            currentPrice: Number(updatedLot.currentPrice),
            bidsCount: updatedLot.bidsCount,
            currentWinnerId: updatedLot.currentWinnerId,
            lotSealHash: updatedLot.lotSealHash,
          },
          receipt: {
            id: receipt.id,
            lotId: receipt.lotId,
            winnerId: receipt.winnerId,
            code: receipt.code,
            finalAmount: Number(receipt.finalAmount),
            lotSealHash: receipt.lotSealHash,
            settledAt: receipt.settledAt,
          },
        }
      }

      // 7. Caso o lote tenha encerrado sem nenhum lance
      const lotSealHash = calculateLotSealHash({
        lotId: lot.id,
        winnerId: null,
        finalPrice: lot.currentPrice,
        totalBids: 0,
        lastBidHash: '0'.repeat(64),
      })

      const updatedLot = await tx.lot.update({
        where: { id: lot.id },
        data: {
          status: 'ENDED',
          lotSealHash,
        },
      })

      return {
        alreadySettled: false,
        lot: {
          id: updatedLot.id,
          title: updatedLot.title,
          status: updatedLot.status,
          currentPrice: Number(updatedLot.currentPrice),
          bidsCount: 0,
          currentWinnerId: null,
          lotSealHash: updatedLot.lotSealHash,
        },
        receipt: null,
      }
    })
  }
}
