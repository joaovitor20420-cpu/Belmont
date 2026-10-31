export class InvalidBidAmountError extends Error {
  constructor(message = 'Valor do lance inválido.') {
    super(message)
    this.name = 'InvalidBidAmountError'
  }
}
