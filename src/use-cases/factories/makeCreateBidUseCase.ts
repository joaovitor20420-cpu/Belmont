import { CreateBidUseCase } from '../createBid.js'

export function makeCreateBidUseCase() {
  const useCase = new CreateBidUseCase()

  return useCase
}
