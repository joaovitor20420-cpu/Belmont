import type { LotsRepository } from '../repositories/lotsRepository.js'
import { formatLotToDTO, type LotDTO } from './createLot.js'
import { ResourceNotFoundError } from './errors/resource-not-found-error.js'

interface GetLotDetailsRequest {
  id: string
}

interface GetLotDetailsResponse {
  lot: LotDTO
}

export class GetLotDetailsUseCase {
  constructor(private lotsRepository: LotsRepository) {}

  async execute({ id }: GetLotDetailsRequest): Promise<GetLotDetailsResponse> {
    const lot = await this.lotsRepository.findById(id)

    if (!lot) {
      throw new ResourceNotFoundError()
    }

    return {
      lot: formatLotToDTO(lot),
    }
  }
}
