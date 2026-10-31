import { PrismaUsersRepository } from '../../repositories/prisma/prismaUsersReporitory.js'
import { AuthenticateUserUseCase } from '../authenticateUser.js'

export function makeAuthenticateUserUseCase(): AuthenticateUserUseCase {
    const usersRepository = new PrismaUsersRepository()
    return new AuthenticateUserUseCase(usersRepository)
}