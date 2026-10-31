export class UserAlreadyExistsError extends Error {
  constructor() {
    super('Já existe um usuário com o mesmo e-mail.')
    this.name = 'UserAlreadyExistsError'
  }
}
