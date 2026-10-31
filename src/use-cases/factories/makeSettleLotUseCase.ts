import { SettleLotUseCase } from '../settleLot.js'

export function makeSettleLotUseCase() {
  const useCase = new SettleLotUseCase()

  return useCase
}
