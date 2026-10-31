import type { User } from '@prisma/client'
import type { UsersRepository } from '../repositories/usersRepositories.js'
import { comparePassword } from '../utils/hash.js'
import { InvalidCredentialsError } from './errors/invalid-credentials-error.js'

interface AuthenticateUserRequest {
  email: string
  password: string
}

interface AuthenticateUserResponse {
  user: User
}

export class AuthenticateUserUseCase {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    email,
    password,
  }: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

   
    const doesPasswordMatch = await comparePassword(password, user.passwordHash)

    if (!doesPasswordMatch) {
      throw new InvalidCredentialsError()
    }

    return { user }
  }
}