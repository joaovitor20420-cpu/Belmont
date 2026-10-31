import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { GetUserProfileUseCase } from '../getUserProfile.js'

export function makeGetUserProfileUseCase(): GetUserProfileUseCase {
  const usersRepository = new PrismaUsersRepository()
  return new GetUserProfileUseCase(usersRepository)
}
