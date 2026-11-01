import type { LoteStatus } from '@prisma/client'
import type { LotsRepository, LotWithWinner } from '../repositories/lotsRepository.js'
import type { UsersRepository } from '../repositories/usersRepositories.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

export interface LotDTO {
  id: string
  title: string
  description: string
  imageUrl: string
  artist: string | null
  externalApiId: string | null
  startPrice: number
  currentPrice: number
  minIncrement: number
  status: LoteStatus
  startTime: Date
  endTime: Date
  lotSealHash: string | null
  bidsCount: number
  currentWinnerId: string | null
  currentWinner?: {
    id: string
    maskedName: string
    publicCode: string
  } | null
  createdAt: Date
  updatedAt: Date
}

export function formatLotToDTO(lot: LotWithWinner): LotDTO {
  return {
    id: lot.id,
    title: lot.title,
    description: lot.description,
    imageUrl: lot.imageUrl,
    artist: lot.artist,
    externalApiId: lot.externalApiId,
    startPrice: Number(lot.startPrice),
    currentPrice: Number(lot.currentPrice),
    minIncrement: Number(lot.minIncrement),
    status: lot.status,
    startTime: lot.startTime,
    endTime: lot.endTime,
    lotSealHash: lot.lotSealHash,
    bidsCount: lot.bidsCount,
    currentWinnerId: lot.currentWinnerId,
    currentWinner: lot.currentWinner ?? null,
    createdAt: lot.createdAt,
    updatedAt: lot.updatedAt,
  }
}

interface CreateLotRequest {
  userId: string
  title: string
  description: string
  imageUrl: string
  artist?: string | null
  externalApiId?: string | null
  startPriceInCents: number
  minIncrementInCents: number
  startTime: Date | string
  endTime: Date | string
}

interface CreateLotResponse {
  lot: LotDTO
}

export class CreateLotUseCase {
  constructor(
    private lotsRepository: LotsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    title,
    description,
    imageUrl,
    artist = null,
    externalApiId = null,
    startPriceInCents,
    minIncrementInCents,
    startTime,
    endTime,
  }: CreateLotRequest): Promise<CreateLotResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new ResourceNotFoundError()
    }

    if (user.role !== 'AUCTIONEER') {
      throw new Error('Apenas leiloeiros podem criar lotes.')
    }

    if (startPriceInCents <= 0) {
      throw new Error('O preço inicial deve ser maior que zero.')
    }

    if (minIncrementInCents <= 0) {
      throw new Error('O incremento mínimo deve ser maior que zero.')
    }

    // Regra de Unicidade: Impede criar lote com item já leiloado ou em pregão
    const existingItemLot = await this.lotsRepository.findExistingNonCancelledByItem({
      externalApiId,
      title,
    })

    if (existingItemLot) {
      if (existingItemLot.status === 'ENDED') {
        throw new Error(
          `Esta obra ("${existingItemLot.title}") já foi leiloada anteriormente e não pode ser republicada em um novo lote.`,
        )
      }

      throw new Error(
        `Esta obra ("${existingItemLot.title}") já possui um lote ativo ou agendado no catálogo.`,
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Datas de início ou término inválidas.')
    }

    if (end <= start) {
      throw new Error('A data de término deve ser posterior à data de início.')
    }

    const now = new Date()
    let status: LoteStatus = 'SCHEDULED'

    if (start <= now && now < end) {
      status = 'LIVE'
    } else if (now >= end) {
      status = 'ENDED'
    }

    const lot = await this.lotsRepository.create({
      userId,
      title,
      description,
      imageUrl,
      artist: artist ?? null,
      externalApiId: externalApiId ?? null,
      startPrice: BigInt(startPriceInCents),
      currentPrice: BigInt(startPriceInCents),
      minIncrement: BigInt(minIncrementInCents),
      status,
      startTime: start,
      endTime: end,
    })

    return {
      lot: formatLotToDTO(lot),
    }
  }
}
