export class LotCancellationError extends Error {
  constructor(
    message = 'Não é permitido cancelar um lote que já possui lances registrados.',
  ) {
    super(message)
    this.name = 'LotCancellationError'
  }
}
