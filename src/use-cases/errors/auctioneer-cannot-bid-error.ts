export class AuctioneerCannotBidError extends Error {
  constructor(
    message = 'Usuários com perfil de Leiloeiro não têm permissão para dar lances em lotes.',
  ) {
    super(message)
    this.name = 'AuctioneerCannotBidError'
  }
}
