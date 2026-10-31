import { User, UserRole } from '@prisma/client'
import { UsersRepository } from '../repositories/usersRepositories.js'
import { UserAlreadyExistsError } from './errors/user-already-exists-error.js'
import { hashPassword } from '../utils/hash.js'
import { maskName, generatePublicCode } from '../utils/lgpd.js'

interface RegisterUserRequest {
  name: string
  email: string
  document: string
  password: string
  role?: UserRole
}
interface RegisterUserResponse {
  user: User
}
export class RegisterUserUseCase {
  constructor(private userRepository: UsersRepository) {}
  async execute({
    name,
    email,
    password,
    document,
    role = 'BIDDER',
  }: RegisterUserRequest): Promise<RegisterUserResponse> {
    const userAlreadyExists = await this.userRepository.findByEmailOrDocument(
      email,
      document,
    )
    if (userAlreadyExists) {
      throw new UserAlreadyExistsError()
    }
    const passwordHash = await hashPassword(password)
    const maskedName = maskName(name)
    const publicCode = generatePublicCode(role)

    const user = await this.userRepository.create({
      name,
      email,
      document,
      passwordHash,
      role,
      publicCode,
      maskedName,
    })
    return {
      user,
    }
  }
}
