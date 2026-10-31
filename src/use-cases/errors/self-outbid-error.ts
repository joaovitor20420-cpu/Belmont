export class SelfOutbidError extends Error {
  constructor(message = 'Você já é o líder atual deste lote.') {
    super(message)
    this.name = 'SelfOutbidError'
  }
}
