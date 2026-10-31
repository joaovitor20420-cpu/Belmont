export class AuctionNotActiveError extends Error {
  constructor(message = 'O lote não está ativo para lances.') {
    super(message)
    this.name = 'AuctionNotActiveError'
  }
}
