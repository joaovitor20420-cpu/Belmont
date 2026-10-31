import type { User } from '@prisma/client'
import type { UsersRepository } from '../repositories/usersRepositories.js'

interface GetUserProfileRequest {
  userId: string
}

interface GetUserProfileResponse {
  user: User
}

export class GetUserProfileUseCase {
  constructor(private userRepository: UsersRepository) {}

  async execute({ userId }: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new Error('Usuário não encontrado.')
    }

    return { user }
  }
}