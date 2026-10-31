import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserAlreadyExistsError } from '../use-cases/errors/user-already-exists-error.js'
import { makeRegisterUserUseCase } from '../use-cases/factories/makeRegisterUserUseCase.js'

export async function registerUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const registerBodySchema = z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email invalido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    document: z.string().min(11, 'O CPF deve ter pelo menos 11 caracteres'),
    role: z.enum(['AUCTIONEER', 'BIDDER']).default('BIDDER'),
  })
  const { name, email, password, document, role } = registerBodySchema.parse(request.body)

  try {
    const registerUserUseCase = makeRegisterUserUseCase()
    const { user } = await registerUserUseCase.execute({
      name,
      email,
      password,
      document,
      role,
    })
    return reply.status(201).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        publicCode: user.publicCode,
        maskedName: user.maskedName,
      },
    })
  } catch (err) {
    if (err instanceof UserAlreadyExistsError) {
      return reply.status(409).send({ message: err.message })
    }
    throw err
  }
}
