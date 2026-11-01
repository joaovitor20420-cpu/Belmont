import { SettleExpiredLotsUseCase } from '../settleExpiredLots.js'

export function makeSettleExpiredLotsUseCase() {
  return new SettleExpiredLotsUseCase()
}
