import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { RegisterUserUseCase } from '../registerUser.js'

export function makeRegisterUserUseCase(): RegisterUserUseCase {
  const usersRepository = new PrismaUsersRepository()
  return new RegisterUserUseCase(usersRepository)
}
