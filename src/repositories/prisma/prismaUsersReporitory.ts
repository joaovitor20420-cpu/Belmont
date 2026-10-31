import { Prisma, User } from '@prisma/client'
import { UsersRepository } from '../usersRepositories.js'
import { prisma } from '../../lib/prisma.js'

export class PrismaUsersRepository implements UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  async findByEmailOrDocument(email: string, document: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ email }, { document }],
      },
    })
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    })
  }
}
