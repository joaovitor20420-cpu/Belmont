export class InsufficientFundsError extends Error {
  constructor(
    message = 'Saldo disponível insuficiente para cobrir o lance.',
  ) {
    super(message)
    this.name = 'InsufficientFundsError'
  }
}
